import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useStaffAvailability,
  useUpsertAvailabilityRule,
  useRemoveAvailabilityRule,
  useUpsertAvailabilityException,
  useRemoveAvailabilityException,
} from "@/hooks/useStaffAvailability";
import { Trash2 } from "lucide-react";
import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  staffId: string;
}

export default function StaffAvailabilityEditor({ staffId }: Props) {
  const { data } = useStaffAvailability(staffId);
  const upsertRule = useUpsertAvailabilityRule();
  const removeRule = useRemoveAvailabilityRule();
  const upsertExc = useUpsertAvailabilityException();
  const removeExc = useRemoveAvailabilityException();

  const [day, setDay] = useState("1");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");

  const [excStart, setExcStart] = useState("");
  const [excEnd, setExcEnd] = useState("");
  const [excReason, setExcReason] = useState("");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Weekly availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {(data?.rules ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No recurring availability set.</p>
            )}
            {(data?.rules ?? []).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>
                  <span className="font-medium">{DAYS[r.day_of_week]}</span> · {r.starts_time.slice(0, 5)} – {r.ends_time.slice(0, 5)}
                  <span className="ml-2 text-muted-foreground">({r.kind})</span>
                </span>
                <Button size="icon" variant="ghost" onClick={() => removeRule.mutate({ id: r.id, staff_id: staffId })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 border-t pt-4">
            <div className="space-y-1.5">
              <Label>Day</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Starts</Label>
              <Input type="time" step={1800} value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ends</Label>
              <Input type="time" step={1800} value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <Button
              className="self-end"
              onClick={() => upsertRule.mutate({ staff_id: staffId, day_of_week: Number(day), starts_time: `${start}:00`, ends_time: `${end}:00` })}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exceptions (PTO / sick / extra)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {(data?.exceptions ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No exceptions recorded.</p>
            )}
            {(data?.exceptions ?? []).map((x) => (
              <div key={x.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>
                  {new Date(x.starts_at).toLocaleString()} → {new Date(x.ends_at).toLocaleString()}{" "}
                  <span className="text-muted-foreground">({x.kind}{x.reason ? ` · ${x.reason}` : ""})</span>
                </span>
                <Button size="icon" variant="ghost" onClick={() => removeExc.mutate({ id: x.id, staff_id: staffId })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 border-t pt-4">
            <div className="space-y-1.5">
              <Label>Starts</Label>
              <Input type="datetime-local" value={excStart} onChange={(e) => setExcStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ends</Label>
              <Input type="datetime-local" value={excEnd} onChange={(e) => setExcEnd(e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Reason</Label>
              <Input value={excReason} onChange={(e) => setExcReason(e.target.value)} placeholder="Annual leave, sick, etc" />
            </div>
            <Button
              className="col-span-4 sm:col-span-1"
              disabled={!excStart || !excEnd}
              onClick={() =>
                upsertExc.mutate(
                  {
                    staff_id: staffId,
                    starts_at: new Date(excStart).toISOString(),
                    ends_at: new Date(excEnd).toISOString(),
                    reason: excReason || null,
                    kind: "unavailable",
                  },
                  {
                    onSuccess: () => {
                      setExcStart("");
                      setExcEnd("");
                      setExcReason("");
                    },
                  }
                )
              }
            >
              Add exception
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}