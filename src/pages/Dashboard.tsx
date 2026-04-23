import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useVisits } from "@/hooks/useVisits";
import { useBookings } from "@/hooks/useBookings";
import { useAgreements } from "@/hooks/useAgreements";
import { useParticipants } from "@/hooks/useParticipantsDb";
import { buildFundingWarnings } from "@/lib/funding";
import { Calendar, ClipboardCheck, AlertTriangle, FileSignature, Plus, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x; }

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { isSupportWorker, role } = useUserRole();

  const today = new Date();
  const { data: todayVisits = [] } = useVisits({
    from: startOfDay(today).toISOString(),
    to: endOfDay(today).toISOString(),
  });
  const { data: weekBookings = [] } = useBookings({
    from: startOfDay(today).toISOString(),
    to: new Date(today.getTime() + 7 * 86400000).toISOString(),
  });
  const { data: agreements = [] } = useAgreements();
  const { data: participants = [] } = useParticipants();
  const fundingWarnings = buildFundingWarnings(participants, agreements);
  const criticalFunding = fundingWarnings.filter((w) => w.severity === "critical");

  // Alert builders
  const unsubmittedNotes = todayVisits.filter((v) => v.status === "completed" && !v.notes_submitted);
  const unsignedVisits = todayVisits.filter((v) => v.status === "completed" && !v.participant_signed);
  const unallocated = weekBookings.filter((b) => b.staff.length === 0);
  const expiringAgreements = agreements.filter((a) => {
    if (a.status !== "active") return false;
    const days = (new Date(a.end_date).getTime() - today.getTime()) / 86400000;
    return days <= 30 && days >= 0;
  });

  const greeting = (() => {
    const h = today.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {today.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold">
            {greeting}{user?.firstName ? `, ${user.firstName}` : ""}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what needs attention today.
          </p>
        </div>
        {!isSupportWorker && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/schedule")}>
              <Calendar className="mr-1.5 h-4 w-4" /> Open schedule
            </Button>
            <Button onClick={() => navigate("/schedule?create=1")}>
              <Plus className="mr-1.5 h-4 w-4" /> New booking
            </Button>
          </div>
        )}
      </header>

      {/* Snapshot tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SnapshotTile label="Today's visits" value={todayVisits.length} icon={ClipboardCheck} to="/visits" />
        <SnapshotTile label="Unsubmitted notes" value={unsubmittedNotes.length} icon={ClipboardCheck} tone={unsubmittedNotes.length > 0 ? "warn" : "ok"} to="/visits" />
        <SnapshotTile label="Unallocated this week" value={unallocated.length} icon={Calendar} tone={unallocated.length > 0 ? "warn" : "ok"} to="/schedule" />
        <SnapshotTile label="Funding warnings" value={fundingWarnings.length} icon={AlertTriangle} tone={fundingWarnings.length > 0 ? "warn" : "ok"} to="/participants" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's visits */}
        <section className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Today's visits</h2>
            <Link to="/visits" className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1">
              All visits <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {todayVisits.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No visits scheduled today.</div>
          ) : (
            <ul className="divide-y divide-border">
              {todayVisits.slice(0, 6).map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <div className="w-16 font-mono text-xs text-muted-foreground">
                    <Clock className="mb-0.5 h-3 w-3" />
                    {new Date(v.scheduled_start).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <Link to={`/visits/${v.id}`} className="flex-1 hover:underline">
                    <span className="font-medium">{v.participant?.name ?? "—"}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      · {v.staff[0]?.display_name ?? "Unallocated"}
                      {v.staff.length > 1 ? ` +${v.staff.length - 1}` : ""}
                    </span>
                  </Link>
                  <span className="text-[11px] capitalize text-muted-foreground">{v.status.replace("_", " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Alerts */}
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Alerts</h2>
            <Link to="/exceptions" className="text-xs font-medium text-accent hover:underline">All</Link>
          </div>
          <ul className="divide-y divide-border">
            <AlertRow show={unsubmittedNotes.length > 0} icon={AlertTriangle} tone="warn"
              text={`${unsubmittedNotes.length} completed visit${unsubmittedNotes.length === 1 ? "" : "s"} without a note`}
              to="/visits"
            />
            <AlertRow show={unsignedVisits.length > 0} icon={AlertTriangle} tone="warn"
              text={`${unsignedVisits.length} visit${unsignedVisits.length === 1 ? "" : "s"} unsigned by participant`}
              to="/visits"
            />
            <AlertRow show={unallocated.length > 0} icon={Calendar} tone="warn"
              text={`${unallocated.length} unallocated booking${unallocated.length === 1 ? "" : "s"} this week`}
              to="/schedule"
            />
            <AlertRow show={expiringAgreements.length > 0} icon={FileSignature} tone="warn"
              text={`${expiringAgreements.length} agreement${expiringAgreements.length === 1 ? "" : "s"} expiring within 30 days`}
              to="/agreements"
            />
            {criticalFunding.slice(0, 3).map((w) => (
              <li key={w.participantId}>
                <Link to={`/participants/${w.participantId}`} className="flex items-start gap-2 px-4 py-2.5 text-sm hover:bg-muted/50">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <span className="text-foreground">
                    <span className="font-medium">{w.participantName}</span>
                    <span className="ml-1 text-muted-foreground">— {w.message}</span>
                  </span>
                  <ArrowRight className="ml-auto mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
          {unsubmittedNotes.length === 0 && unsignedVisits.length === 0 && unallocated.length === 0 && expiringAgreements.length === 0 && criticalFunding.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">All clear. 🎉</div>
          )}
        </section>
      </div>
    </div>
  );
}

function SnapshotTile({ label, value, icon: Icon, to, tone = "ok" }: {
  label: string; value: number; icon: any; to: string; tone?: "ok" | "warn";
}) {
  return (
    <Link
      to={to}
      className="group rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tone === "warn" ? "text-warning-foreground" : "text-muted-foreground"}`} />
      </div>
      <p className={`mt-2 text-2xl font-semibold ${tone === "warn" && value > 0 ? "text-destructive" : "text-foreground"}`}>
        {value}
      </p>
    </Link>
  );
}

function AlertRow({ show, icon: Icon, text, to, tone }: {
  show: boolean; icon: any; text: string; to: string; tone: "warn" | "info";
}) {
  if (!show) return null;
  return (
    <li>
      <Link to={to} className="flex items-start gap-2 px-4 py-2.5 text-sm hover:bg-muted/50">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone === "warn" ? "text-warning-foreground" : "text-info"}`} />
        <span className="text-foreground">{text}</span>
        <ArrowRight className="ml-auto mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
      </Link>
    </li>
  );
}
