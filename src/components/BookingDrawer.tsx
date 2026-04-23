import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParticipants } from "@/hooks/useParticipantsDb";
import { useCreateBooking } from "@/hooks/useBookings";
import { useStaff, staffDisplayName } from "@/hooks/useStaff";
import { useNdisCategories } from "@/hooks/useNdisCategories";
import { useStaffSkills } from "@/hooks/useStaffSkills";
import { isHalfHourSlot } from "@/hooks/useStaffAvailability";
import { toast } from "sonner";

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
  const [staffId, setStaffId] = useState<string>("");
  const [supportCategory, setSupportCategory] = useState<string>("");
  const [serviceType, setServiceType] = useState("Personal care");
  const [startsAt, setStartsAt] = useState(toLocalInput(initialStart));
  const [endsAt, setEndsAt] = useState(toLocalInput(initialEnd));
  const [overrideLocation, setOverrideLocation] = useState(false);
  const [locationAddress, setLocationAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Re-seed dates when drawer is reopened with a new default
  useEffect(() => {
    if (open) {
      const s = snapToHalfHour(defaultDate ?? new Date());
      setStartsAt(toLocalInput(s));
      setEndsAt(toLocalInput(new Date(s.getTime() + 60 * 60 * 1000)));
    }
  }, [open, defaultDate]);

  // Look up skills of the chosen staff to flag mismatch with the chosen category
  const { data: skills = [] } = useStaffSkills(staffId || undefined);
  const staffHasCategory = !supportCategory || !staffId || skills.some((s) => s.support_category === supportCategory);

  const participant = useMemo(() => participants.find((p) => p.id === participantId), [participants, participantId]);
  const derivedAddress = participant?.address ?? "";

  // Filter staff list down to those who carry the chosen category (when set)
  const eligibleStaff = useMemo(() => {
    return staff.filter((s) => s.bookable && s.status === "active");
  }, [staff]);

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
    if (staffId && supportCategory && !staffHasCategory) {
      toast.error("Selected staff is not skilled in this NDIS category.");
      return;
    }

    await create.mutateAsync({
      participant_id: participantId,
      staff_id: staffId || null,
      assigned_worker_id: staffId || null,
      assigned_worker_name: staffId ? staffDisplayName(staff.find((s) => s.id === staffId)!) : null,
      support_category: supportCategory || null,
      service_type: serviceType,
      starts_at: startD.toISOString(),
      ends_at: endD.toISOString(),
      location_source: overrideLocation ? "override" : "participant",
      location_address: overrideLocation ? locationAddress || null : derivedAddress || null,
      location: overrideLocation ? locationAddress || null : derivedAddress || null,
      notes: notes || null,
    });
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
                {categories.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className="space-y-1.5">
            <Label>Assign staff</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger><SelectValue placeholder="Leave unallocated…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unallocated</SelectItem>
                {eligibleStaff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{staffDisplayName(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {staffId && supportCategory && !staffHasCategory && (
              <p className="text-xs text-destructive">This staff member does not list this category as a skill.</p>
            )}
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="override">Override location</Label>
              <Switch id="override" checked={overrideLocation} onCheckedChange={setOverrideLocation} />
            </div>
            {!overrideLocation ? (
              <p className="text-xs text-muted-foreground">
                {derivedAddress ? `Using participant address: ${derivedAddress}` : "Participant has no address on file."}
              </p>
            ) : (
              <Input
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Enter override address"
              />
            )}
          </div>

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
            <Button type="submit" disabled={create.isPending || !participantId}>
              {create.isPending ? "Saving…" : "Create booking"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}