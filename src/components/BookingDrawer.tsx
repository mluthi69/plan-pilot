import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParticipants } from "@/hooks/useParticipantsDb";
import { useCreateBooking } from "@/hooks/useBookings";
import { useStaff, staffDisplayName } from "@/hooks/useStaff";
import { useNdisCategories } from "@/hooks/useNdisCategories";
import { isHalfHourSlot } from "@/hooks/useStaffAvailability";
import { toast } from "sonner";
import BookingLocationPicker, { ResolvedLocation } from "@/components/locations/BookingLocationPicker";
import { useFundingAgreements, useFundingSpend } from "@/hooks/useFundingAgreements";
import { useOrgSettings } from "@/hooks/useOrgSettings";
import { computeAvailable, findPeriodFor, hoursBetween } from "@/lib/fundingPeriods";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

function snapToHalfHour(d: Date): Date {
  const r = new Date(d);
  r.setSeconds(0, 0);
  const m = r.getMinutes();
  r.setMinutes(m < 15 ? 0 : m < 45 ? 30 : 60);
  return r;
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BookingDrawer({ open, onOpenChange, defaultDate }: Props) {
  const { data: participants = [] } = useParticipants();
  const { data: staff = [] } = useStaff();
  const { data: categories = [] } = useNdisCategories();
  const create = useCreateBooking();

  const initialStart = snapToHalfHour(defaultDate ?? new Date());
  const initialEnd = new Date(initialStart.getTime() + 60 * 60 * 1000);

  const [participantId, setParticipantId] = useState("");
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [supportCategory, setSupportCategory] = useState<string>("");
  const [serviceType, setServiceType] = useState("Personal care");
  const [startsAt, setStartsAt] = useState(toLocalInput(initialStart));
  const [endsAt, setEndsAt] = useState(toLocalInput(initialEnd));
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [location, setLocation] = useState<ResolvedLocation>({
    location_kind: "participant_address",
    participant_address_id: null,
    location_id: null,
    location_address: null,
    end_lat: null,
    end_lng: null,
  });
  const [notes, setNotes] = useState("");

  // Re-seed dates when drawer is reopened with a new default
  useEffect(() => {
    if (open) {
      const s = snapToHalfHour(defaultDate ?? new Date());
      setStartsAt(toLocalInput(s));
      setEndsAt(toLocalInput(new Date(s.getTime() + 60 * 60 * 1000)));
      setStaffIds([]);
      setLocation({
        location_kind: "participant_address",
        participant_address_id: null,
        location_id: null,
        location_address: null,
        end_lat: null,
        end_lng: null,
      });
    }
  }, [open, defaultDate]);

  const participant = useMemo(() => participants.find((p) => p.id === participantId), [participants, participantId]);

  // Funding-aware checks
  const { data: agreements = [] } = useFundingAgreements(participantId || undefined);
  const { data: spendData } = useFundingSpend(participantId || undefined);
  const { data: orgSettings } = useOrgSettings();

  // Restrict the category dropdown to those covered by an active agreement
  // (when the participant has at least one agreement). Falls back to full list otherwise.
  const allowedCategoryCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const a of agreements) {
      if (a.status !== "active") continue;
      for (const c of a.categories) codes.add(c.support_category_code);
    }
    return codes;
  }, [agreements]);

  const visibleCategories = useMemo(() => {
    if (allowedCategoryCodes.size === 0) return categories;
    return categories.filter((c) => allowedCategoryCodes.has(c.code));
  }, [categories, allowedCategoryCodes]);

  const hours = useMemo(() => {
    try { return hoursBetween(new Date(startsAt), new Date(endsAt)); } catch { return 0; }
  }, [startsAt, endsAt]);

  const lineAmount = useMemo(
    () => Math.max(0, hours * Number(unitPrice || 0)),
    [hours, unitPrice],
  );

  // Find the period this booking falls into for the chosen category
  const fundingCheck = useMemo(() => {
    if (!supportCategory || !startsAt) return null;
    // collect periods for this category from active agreements
    const periods: any[] = [];
    for (const a of agreements) {
      if (a.status !== "active") continue;
      for (const c of a.categories) {
        if (c.support_category_code !== supportCategory) continue;
        for (const p of c.periods ?? []) periods.push(p);
      }
    }
    if (periods.length === 0) return { kind: "no-agreement" as const };
    const period = findPeriodFor(new Date(startsAt), periods);
    if (!period) return { kind: "out-of-range" as const };
    const rolloverEnabled =
      agreements.find((a) => a.categories.some((c) => c.id === period.agreement_category_id))
        ?.allow_unspent_rollover ?? !!orgSettings?.allow_unspent_rollover;
    const breakdown = computeAvailable(
      period,
      periods,
      spendData?.spendByPeriod ?? {},
      !!rolloverEnabled,
    );
    return { kind: "ok" as const, period, breakdown };
  }, [supportCategory, startsAt, agreements, spendData, orgSettings]);

  const overBudget =
    fundingCheck?.kind === "ok" && lineAmount > 0 && lineAmount > fundingCheck.breakdown.available;

  function money(n: number) {
    return `$${Number(n).toLocaleString("en-AU", { minimumFractionDigits: 2 })}`;
  }

  // Filter staff list down to those who carry the chosen category (when set)
  const eligibleStaff = useMemo(() => {
    return staff.filter((s) => s.bookable && s.status === "active");
  }, [staff]);

  function toggleStaff(id: string) {
    setStaffIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!participantId) return;

    const startD = new Date(startsAt);
    const endD = new Date(endsAt);
    if (!isHalfHourSlot(startD) || !isHalfHourSlot(endD)) {
      toast.error("Bookings must start and end on a half-hour boundary.");
      return;
    }
    if (endD <= startD) {
      toast.error("End time must be after start time.");
      return;
    }
    if (overBudget) {
      toast.error("This booking exceeds the available funding for the period.");
      return;
    }

    await create.mutateAsync({
      participant_id: participantId,
      staff_ids: staffIds,
      support_category: supportCategory || null,
      service_type: serviceType,
      starts_at: startD.toISOString(),
      ends_at: endD.toISOString(),
      // Persist quantity/unit/unit_price so spend math + invoicing work later.
      // (BookingInput allows extra keys via cast.)
      quantity: hours,
      unit: "hours",
      unit_price: unitPrice ? Number(unitPrice) : null,
      location_kind: location.location_kind,
      participant_address_id: location.participant_address_id,
      location_id: location.location_id,
      location_source: location.location_kind === "override" ? "override" : "participant",
      location_address: location.location_address,
      location: location.location_address,
      end_lat: location.end_lat,
      end_lng: location.end_lng,
      notes: notes || null,
    } as any);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New booking</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Participant *</Label>
            <Select value={participantId} onValueChange={setParticipantId}>
              <SelectTrigger><SelectValue placeholder="Select participant…" /></SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>NDIS support category</Label>
            <Select value={supportCategory} onValueChange={setSupportCategory}>
              <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
              <SelectContent>
                {visibleCategories.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {allowedCategoryCodes.size > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Showing only categories covered by an active agreement.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Service type</Label>
            <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Starts</Label>
              <Input type="datetime-local" step={1800} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Ends</Label>
              <Input type="datetime-local" step={1800} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
            </div>
          </div>

          {/* Quantity / pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration (hours)</Label>
              <Input value={hours.toFixed(2)} readOnly className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label>Hourly rate ($)</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="e.g. 67.56"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Funding live check */}
          {participantId && supportCategory && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
              {fundingCheck?.kind === "no-agreement" && (
                <p className="flex items-center gap-1.5 text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  No active agreement covers this category for this participant.
                </p>
              )}
              {fundingCheck?.kind === "out-of-range" && (
                <p className="flex items-center gap-1.5 text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  The selected date is outside any funding period for this category.
                </p>
              )}
              {fundingCheck?.kind === "ok" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Period P{fundingCheck.period.period_index + 1}</span>
                    <span className="text-muted-foreground">
                      {money(fundingCheck.breakdown.spent)} / {money(fundingCheck.breakdown.allocated)} spent
                    </span>
                  </div>
                  {fundingCheck.breakdown.rolledOver > 0 && (
                    <p className="text-success">
                      +{money(fundingCheck.breakdown.rolledOver)} rolled over from prior periods
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-semibold">{money(fundingCheck.breakdown.available)}</span>
                  </div>
                  {lineAmount > 0 && (
                    <div className="flex items-center justify-between border-t border-border pt-1">
                      <span className="text-muted-foreground">This booking</span>
                      <span className={overBudget ? "font-semibold text-destructive" : "font-semibold"}>{money(lineAmount)}</span>
                    </div>
                  )}
                  {overBudget ? (
                    <p className="flex items-center gap-1.5 text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Exceeds available funding for this period.
                    </p>
                  ) : lineAmount > 0 ? (
                    <p className="flex items-center gap-1.5 text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Within available funding.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Assign staff</Label>
              {staffIds.length > 0 && (
                <span className="text-xs text-muted-foreground">{staffIds.length} selected</span>
              )}
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
              {eligibleStaff.length === 0 && (
                <p className="px-1 py-2 text-xs text-muted-foreground">No bookable staff available.</p>
              )}
              {eligibleStaff.map((s) => {
                const checked = staffIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleStaff(s.id)} />
                    <span>{staffDisplayName(s)}</span>
                    {checked && staffIds[0] === s.id && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">primary</Badge>
                    )}
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">First selected staff acts as primary; the rest as support.</p>
          </div>

          <BookingLocationPicker
            participantId={participantId || undefined}
            value={location}
            onChange={setLocation}
          />

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !participantId || overBudget}>
              {create.isPending ? "Saving…" : "Create booking"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}