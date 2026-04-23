import { Link } from "react-router-dom";
import { useVisits } from "@/hooks/useVisits";
import { Clock, MapPin, ChevronRight, AlertCircle, CheckCircle2, Navigation } from "lucide-react";

/** Great-circle distance in km between two coords. */
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function startOfDay(d: Date) {
  const x = new Date(d); x.setHours(0,0,0,0); return x;
}
function endOfDay(d: Date) {
  const x = new Date(d); x.setHours(23,59,59,999); return x;
}

export default function MyDay() {
  const today = new Date();
  // TODO: once we map Clerk users → staff records, filter by the signed-in
  // staff via { staffId }. For now show all of today's visits.
  const { data: list = [], isLoading } = useVisits({
    from: startOfDay(today).toISOString(),
    to: endOfDay(today).toISOString(),
  });

  const fmtTime = (s: string) => new Date(s).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  const completed = list.filter((v) => v.status === "completed").length;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {today.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-2xl font-semibold mt-0.5">My Day</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.length} visit{list.length === 1 ? "" : "s"} · {completed} done
        </p>
      </header>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
          <p className="mt-2 text-sm font-medium">No visits today</p>
          <p className="text-xs text-muted-foreground">Enjoy the day off.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((v, idx) => {
            const isInProgress = v.status === "in_progress";
            const isDone = v.status === "completed";
            const needsNote = isDone && !v.notes_submitted;
            const prev = idx > 0 ? list[idx - 1] : null;
            const hasHop =
              prev &&
              prev.end_lat != null && prev.end_lng != null &&
              v.end_lat != null && v.end_lng != null;
            const hopKm = hasHop
              ? haversineKm(
                  { lat: prev!.end_lat as number, lng: prev!.end_lng as number },
                  { lat: v.end_lat as number, lng: v.end_lng as number }
                )
              : null;
            // Rough driving estimate: 40 km/h average urban + 2 min buffer.
            const hopMin = hopKm != null ? Math.round((hopKm / 40) * 60 + 2) : null;

            return (
              <li key={v.id} className="space-y-2">
                {hopKm != null && (
                  <div className="ml-20 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Navigation className="h-3 w-3" />
                    <span>~{hopKm.toFixed(1)} km · {hopMin} min drive from previous stop</span>
                  </div>
                )}
                <Link
                  to={`/visits/${v.id}`}
                  className={`flex items-stretch overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-sm ${
                    isInProgress ? "border-warning/50" : isDone ? "border-success/40" : "border-border"
                  }`}
                >
                  <div className={`flex w-20 flex-col items-center justify-center text-xs font-mono ${
                    isInProgress ? "bg-warning/10 text-warning-foreground" :
                    isDone ? "bg-success/10 text-success" : "bg-secondary text-foreground"
                  }`}>
                    <span className="text-base font-bold">{fmtTime(v.scheduled_start)}</span>
                    <span className="opacity-70">{fmtTime(v.scheduled_end)}</span>
                  </div>
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{v.participant?.name ?? "Participant"}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {Math.round((new Date(v.scheduled_end).getTime() - new Date(v.scheduled_start).getTime())/60000)} min
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      {isInProgress && (
                        <span className="rounded-full bg-warning/15 px-2 py-0.5 font-medium text-warning-foreground">
                          In progress
                        </span>
                      )}
                      {isDone && (
                        <span className="rounded-full bg-success/15 px-2 py-0.5 font-medium text-success">
                          Completed
                        </span>
                      )}
                      {needsNote && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Note required
                        </span>
                      )}
                      {!v.participant_signed && isDone && (
                        <span className="rounded-full bg-warning/15 px-2 py-0.5 font-medium text-warning-foreground">
                          Unsigned
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}