import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Route, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  TravelLineType, TRAVEL_RATES,
  useBookingTravelLines, useCreateTravelLine, useDeleteTravelLine,
  useUpdateStaffBookingTravel,
} from "@/hooks/useBookingTravel";
import { useDistanceMatrix } from "@/hooks/useGeocode";
import { useBookings } from "@/hooks/useBookings";
import { toast } from "sonner";

interface Props {
  bookingId: string;
}

const lineLabel: Record<TravelLineType, string> = {
  provider_travel_labour: "Provider travel (labour)",
  non_labour_transport: "Non-labour transport (km)",
};

export default function BookingTravelPanel({ bookingId }: Props) {
  const { data: bookings = [] } = useBookings();
  const booking = useMemo(() => bookings.find((b) => b.id === bookingId), [bookings, bookingId]);
  const { data: lines = [], isLoading } = useBookingTravelLines(bookingId);
  const createLine = useCreateTravelLine();
  const delLine = useDeleteTravelLine();
  const updateStaffTravel = useUpdateStaffBookingTravel();
  const distance = useDistanceMatrix();

  const totalKm = lines.reduce((s, l) => s + Number(l.kilometres), 0);
  const totalMinutes = lines.reduce((s, l) => s + l.minutes, 0);
  const totalAmount = lines.reduce((s, l) => s + Number(l.amount), 0);

  async function computeTravel(staffLink: NonNullable<typeof booking>["staff"][number]) {
    if (!booking) return;
    if (!booking.end_lat || !booking.end_lng) {
      toast.error("This booking has no geocoded location. Set a saved address or geocode the override.");
      return;
    }
    // Find this staff's previous booking that day (same staff_id, ends before this start, with coords).
    const sameDay = bookings
      .filter((b) =>
        b.id !== booking.id &&
        b.starts_at.slice(0, 10) === booking.starts_at.slice(0, 10) &&
        new Date(b.ends_at) <= new Date(booking.starts_at) &&
        b.staff.some((s) => s.staff_id === staffLink.staff_id) &&
        b.end_lat && b.end_lng,
      )
      .sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime());
    const prev = sameDay[0];
    if (!prev) {
      toast.info("No earlier geocoded booking for this staff today. Travel left at 0.");
      return;
    }
    try {
      const rows = await distance.mutateAsync({
        origins: [{ lat: prev.end_lat!, lng: prev.end_lng! }],
        destinations: [{ lat: booking.end_lat!, lng: booking.end_lng! }],
      });
      const cell = rows[0]?.[0];
      if (!cell || cell.status !== "OK") {
        toast.error(`Travel lookup failed (${cell?.status ?? "unknown"})`);
        return;
      }
      await updateStaffTravel.mutateAsync({
        id: staffLink.link_id,
        travel_minutes_before: cell.minutes,
        travel_km_before: cell.km,
        travel_from_label: prev.resolved_location_name ?? prev.location_address ?? "Previous booking",
        travel_from_lat: prev.end_lat,
        travel_from_lng: prev.end_lng,
      });
      toast.success(`${cell.km} km · ${cell.minutes} min computed`);
    } catch (e: any) {
      toast.error(e.message ?? "Distance lookup failed");
    }
  }

  async function billTravel(staffLink: NonNullable<typeof booking>["staff"][number], type: TravelLineType) {
    if (!booking) return;
    const km = Number(staffLink.travel_km_before ?? 0);
    const minutes = staffLink.travel_minutes_before ?? 0;
    if (!km && !minutes) {
      toast.error("No travel computed yet for this staff member.");
      return;
    }
    const unit = type === "provider_travel_labour"
      ? TRAVEL_RATES.provider_travel_labour_per_hour
      : TRAVEL_RATES.non_labour_per_km;
    const qty = type === "provider_travel_labour" ? minutes / 60 : km;
    const amount = unit * qty;
    await createLine.mutateAsync({
      booking_id: booking.id,
      staff_booking_id: staffLink.link_id,
      line_type: type,
      minutes: type === "provider_travel_labour" ? minutes : 0,
      kilometres: type === "non_labour_transport" ? km : 0,
      unit_rate: unit,
      amount,
      support_item_code: null,
      mmm_zone: null,
      notes: null,
    });
  }

  if (!booking) {
    return <p className="text-sm text-muted-foreground py-4">Booking not loaded.</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Route className="h-4 w-4" /> Travel before booking
          </CardTitle>
          <CardDescription>
            Distance and time from each staff member's previous stop today.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {booking.staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">No staff assigned.</p>
          ) : booking.staff.map((s) => (
            <div key={s.link_id} className="flex items-center gap-3 p-2 rounded-md border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.display_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {s.travel_km_before != null && s.travel_minutes_before != null
                    ? `${s.travel_km_before} km · ${s.travel_minutes_before} min from ${s.travel_from_label ?? "previous stop"}`
                    : "No travel computed yet"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => computeTravel(s)} disabled={distance.isPending}>
                {distance.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
                Compute
              </Button>
              <Button size="sm" variant="outline" onClick={() => billTravel(s, "provider_travel_labour")}>
                Bill labour
              </Button>
              <Button size="sm" variant="outline" onClick={() => billTravel(s, "non_labour_transport")}>
                Bill km
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">Travel claim lines</CardTitle>
            <CardDescription>NDIS-billable travel for this booking.</CardDescription>
          </div>
          <ManualLineForm
            onAdd={(input) => createLine.mutateAsync({
              booking_id: booking.id,
              staff_booking_id: null,
              ...input,
            })}
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No travel lines yet.</p>
          ) : (
            <div className="space-y-1">
              {lines.map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-2 rounded-md border text-sm">
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">{lineLabel[l.line_type]}</Badge>
                  <span className="flex-1">
                    {l.line_type === "non_labour_transport"
                      ? `${l.kilometres} km`
                      : `${l.minutes} min`}
                    {l.unit_rate != null && (
                      <span className="text-muted-foreground"> · ${Number(l.unit_rate).toFixed(2)}</span>
                    )}
                  </span>
                  <span className="font-medium">${Number(l.amount).toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => delLine.mutate({ id: l.id, booking_id: booking.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t flex items-center gap-3 text-xs text-muted-foreground">
                <span>{totalKm.toFixed(1)} km</span>
                <span>·</span>
                <span>{totalMinutes} min</span>
                <span className="ml-auto font-medium text-foreground">Total ${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ManualInput {
  line_type: TravelLineType;
  minutes: number;
  kilometres: number;
  unit_rate: number | null;
  amount: number;
  support_item_code: string | null;
  mmm_zone: string | null;
  notes: string | null;
}

function ManualLineForm({ onAdd }: { onAdd: (input: ManualInput) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TravelLineType>("non_labour_transport");
  const [km, setKm] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const unit = type === "provider_travel_labour"
    ? TRAVEL_RATES.provider_travel_labour_per_hour
    : TRAVEL_RATES.non_labour_per_km;
  const qty = type === "provider_travel_labour" ? minutes / 60 : km;
  const amount = unit * qty;

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />Add line
      </Button>
    );
  }

  return (
    <div className="flex items-end gap-2 flex-wrap">
      <div className="space-y-1">
        <Label className="text-[10px]">Type</Label>
        <Select value={type} onValueChange={(v: TravelLineType) => setType(v)}>
          <SelectTrigger className="h-8 text-xs w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="non_labour_transport">Transport (km)</SelectItem>
            <SelectItem value="provider_travel_labour">Labour (min)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {type === "non_labour_transport" ? (
        <div className="space-y-1">
          <Label className="text-[10px]">Km</Label>
          <Input type="number" className="h-8 w-20" value={km} onChange={(e) => setKm(Number(e.target.value))} />
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-[10px]">Minutes</Label>
          <Input type="number" className="h-8 w-20" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
        </div>
      )}
      <div className="space-y-1">
        <Label className="text-[10px]">Amount</Label>
        <p className="h-8 text-sm font-medium">${amount.toFixed(2)}</p>
      </div>
      <Button size="sm" onClick={async () => {
        await onAdd({
          line_type: type,
          minutes: type === "provider_travel_labour" ? minutes : 0,
          kilometres: type === "non_labour_transport" ? km : 0,
          unit_rate: unit,
          amount,
          support_item_code: null,
          mmm_zone: null,
          notes: null,
        });
        setOpen(false); setKm(0); setMinutes(0);
      }}>Add</Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}
