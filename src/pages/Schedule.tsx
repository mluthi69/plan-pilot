import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookings, type Booking } from "@/hooks/useBookings";
import BookingDrawer from "@/components/BookingDrawer";

type View = "day" | "week" | "list";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Monday-first
  x.setDate(x.getDate() - day);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}
function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

const statusColor: Record<string, string> = {
  scheduled: "bg-info/10 text-info border-info/30",
  confirmed: "bg-accent/10 text-accent border-accent/30",
  in_progress: "bg-warning/15 text-warning-foreground border-warning/40",
  completed: "bg-success/10 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground border-border line-through",
  no_show: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function Schedule() {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ?create=1 opens the drawer (used by sidebar quick action)
  useEffect(() => {
    if (params.get("create") === "1") {
      setDrawerOpen(true);
      params.delete("create");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const { from, to, days } = useMemo(() => {
    if (view === "day") {
      return { from: startOfDay(cursor), to: endOfDay(cursor), days: [startOfDay(cursor)] };
    }
    const start = startOfWeek(cursor);
    const end = endOfDay(addDays(start, 6));
    return {
      from: start,
      to: end,
      days: Array.from({ length: 7 }, (_, i) => addDays(start, i)),
    };
  }, [cursor, view]);

  const { data: bookings = [], isLoading } = useBookings({
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const unallocated = bookings.filter((b) => !b.assigned_worker_name);

  function bookingsForDay(day: Date): Booking[] {
    const s = startOfDay(day).getTime();
    const e = endOfDay(day).getTime();
    return bookings.filter((b) => {
      const t = new Date(b.starts_at).getTime();
      return t >= s && t <= e;
    });
  }

  function shift(delta: number) {
    setCursor((c) => addDays(c, view === "day" ? delta : delta * 7));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Today, this week, and what still needs allocating.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border bg-card p-0.5 text-xs">
            {(["day", "week", "list"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded px-2.5 py-1 capitalize transition-colors ${
                  view === v ? "bg-secondary text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Button onClick={() => setDrawerOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New booking
          </Button>
        </div>
      </div>

      {/* Date navigator */}
      <div className="flex items-center gap-2">
        <button onClick={() => shift(-1)} className="rounded-md border border-border p-1.5 hover:bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => setCursor(new Date())} className="rounded-md border border-border px-3 py-1 text-xs font-medium hover:bg-secondary">
          Today
        </button>
        <button onClick={() => shift(1)} className="rounded-md border border-border p-1.5 hover:bg-secondary">
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="ml-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          {view === "day"
            ? fmtDate(cursor)
            : `${fmtDate(days[0])} – ${fmtDate(days[days.length - 1])}`}
        </span>
      </div>

      {/* Unallocated banner */}
      {unallocated.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          <span className="font-medium text-foreground">{unallocated.length}</span>{" "}
          <span className="text-muted-foreground">
            unallocated visit{unallocated.length === 1 ? "" : "s"} in this range.
          </span>
        </div>
      )}

      {/* Calendar grid */}
      {view === "list" ? (
        <div className="rounded-lg border border-border bg-card">
          {bookings.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {isLoading ? "Loading…" : "No bookings in this range."}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                  <div className="w-32 text-muted-foreground">
                    {new Date(b.starts_at).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
                    <br />
                    <span className="font-mono text-xs">{fmtTime(b.starts_at)}–{fmtTime(b.ends_at)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{b.participant_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{b.service_type} · {b.assigned_worker_name ?? "Unallocated"}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${statusColor[b.status] ?? ""}`}>
                    {b.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className={`grid gap-3 ${view === "day" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-7"}`}>
          {days.map((day) => {
            const items = bookingsForDay(day);
            const isToday = startOfDay(new Date()).getTime() === startOfDay(day).getTime();
            return (
              <div
                key={day.toISOString()}
                className={`flex flex-col rounded-lg border bg-card p-3 ${
                  isToday ? "border-primary/40 shadow-sm" : "border-border"
                }`}
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {day.toLocaleDateString("en-AU", { weekday: "short" })}
                  </span>
                  <span className={`text-sm ${isToday ? "font-bold text-primary" : "text-foreground"}`}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.length === 0 && (
                    <p className="py-4 text-center text-[11px] text-muted-foreground">No visits</p>
                  )}
                  {items.map((b) => (
                    <div
                      key={b.id}
                      className={`rounded border px-2 py-1.5 text-xs ${statusColor[b.status] ?? "border-border"}`}
                    >
                      <div className="font-mono text-[10px] opacity-80">{fmtTime(b.starts_at)}</div>
                      <div className="font-medium text-foreground">{b.participant_name ?? "—"}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {b.assigned_worker_name ?? "Unallocated"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BookingDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}