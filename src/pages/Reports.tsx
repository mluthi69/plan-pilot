import { useMemo } from "react";
import { useVisits } from "@/hooks/useVisits";
import { useInvoices } from "@/hooks/useInvoices";
import { useParticipants } from "@/hooks/useParticipantsDb";
import { useAgreements } from "@/hooks/useAgreements";

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday-indexed
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function weekKey(d: Date) {
  const w = startOfWeek(d);
  return w.toISOString().slice(0, 10);
}

export default function Reports() {
  const { data: visits = [] } = useVisits();
  const { data: invoices = [] } = useInvoices();
  const { data: participants = [] } = useParticipants();
  const { data: agreements = [] } = useAgreements();

  const stats = useMemo(() => {
    const completed = visits.filter((v) => v.status === "completed");
    const cancelled = visits.filter((v) => v.status === "cancelled" || v.status === "no_show");
    const noteRate = completed.length
      ? Math.round((completed.filter((v) => v.notes_submitted).length / completed.length) * 100)
      : 0;
    const signRate = completed.length
      ? Math.round((completed.filter((v) => v.participant_signed).length / completed.length) * 100)
      : 0;
    const invoicedTotal = invoices.reduce((n, i) => n + Number(i.amount), 0);
    const paidTotal = invoices
      .filter((i) => i.status === "paid")
      .reduce((n, i) => n + Number(i.amount), 0);
    return {
      visits: visits.length,
      completed: completed.length,
      cancelled: cancelled.length,
      noteRate,
      signRate,
      activeParticipants: participants.filter((p) => p.status === "active").length,
      activeAgreements: agreements.filter((a) => a.status === "active").length,
      invoicedTotal,
      paidTotal,
    };
  }, [visits, invoices, participants, agreements]);

  const weekly = useMemo(() => {
    const map = new Map<string, { week: string; completed: number; cancelled: number; invoiced: number }>();
    const seed = (k: string, label: string) => {
      if (!map.has(k)) map.set(k, { week: label, completed: 0, cancelled: 0, invoiced: 0 });
      return map.get(k)!;
    };
    for (const v of visits) {
      const k = weekKey(new Date(v.scheduled_start));
      const label = new Date(k).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
      const row = seed(k, label);
      if (v.status === "completed") row.completed++;
      if (v.status === "cancelled" || v.status === "no_show") row.cancelled++;
    }
    for (const i of invoices) {
      const k = weekKey(new Date(i.received_at));
      const label = new Date(k).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
      const row = seed(k, label);
      row.invoiced += Number(i.amount);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 8)
      .map(([, v]) => v);
  }, [visits, invoices]);

  const maxCompleted = Math.max(1, ...weekly.map((w) => w.completed));
  const maxInvoiced = Math.max(1, ...weekly.map((w) => w.invoiced));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational signals from your daily loop.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Active participants" value={stats.activeParticipants} />
        <Kpi label="Active agreements" value={stats.activeAgreements} />
        <Kpi label="Visits delivered" value={stats.completed} />
        <Kpi label="Cancellations" value={stats.cancelled} tone={stats.cancelled > 0 ? "warn" : undefined} />
        <Kpi label="Notes complete" value={`${stats.noteRate}%`} tone={stats.noteRate < 80 ? "warn" : "ok"} />
        <Kpi label="Signed" value={`${stats.signRate}%`} tone={stats.signRate < 80 ? "warn" : "ok"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Visits per week</h2>
            <p className="text-[11px] text-muted-foreground">Completed vs cancelled — last 8 weeks</p>
          </div>
          {weekly.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">No data yet.</div>
          ) : (
            <div className="space-y-2 px-4 py-4">
              {weekly.map((w) => (
                <div key={w.week} className="flex items-center gap-3 text-xs">
                  <span className="w-14 text-muted-foreground">{w.week}</span>
                  <div className="flex flex-1 items-center gap-1">
                    <div
                      className="h-3 rounded-sm bg-success/70"
                      style={{ width: `${(w.completed / maxCompleted) * 70}%` }}
                    />
                    {w.cancelled > 0 && (
                      <div
                        className="h-3 rounded-sm bg-destructive/60"
                        style={{ width: `${(w.cancelled / maxCompleted) * 70}%` }}
                      />
                    )}
                  </div>
                  <span className="w-16 text-right text-muted-foreground">
                    {w.completed}/{w.completed + w.cancelled}
                  </span>
                </div>
              ))}
              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-success/70" /> Completed</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-destructive/60" /> Cancelled</span>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Invoiced revenue per week</h2>
            <p className="text-[11px] text-muted-foreground">
              Total ${stats.invoicedTotal.toLocaleString("en-AU")} · Paid ${stats.paidTotal.toLocaleString("en-AU")}
            </p>
          </div>
          {weekly.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">No data yet.</div>
          ) : (
            <div className="space-y-2 px-4 py-4">
              {weekly.map((w) => (
                <div key={w.week} className="flex items-center gap-3 text-xs">
                  <span className="w-14 text-muted-foreground">{w.week}</span>
                  <div className="flex-1">
                    <div
                      className="h-3 rounded-sm bg-accent/70"
                      style={{ width: `${(w.invoiced / maxInvoiced) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-medium">${w.invoiced.toLocaleString("en-AU")}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: "ok" | "warn" }) {
  const color = tone === "warn" ? "text-warning" : tone === "ok" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}