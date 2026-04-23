import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVisits, type VisitStatus } from "@/hooks/useVisits";

const tabs: { key: VisitStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "no_show", label: "No-show" },
];

const statusBadge: Record<string, string> = {
  scheduled: "bg-info/10 text-info border-info/30",
  in_progress: "bg-warning/15 text-warning-foreground border-warning/40",
  completed: "bg-success/10 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  no_show: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function Visits() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<VisitStatus | "all">("all");
  const { data = [], isLoading } = useVisits(tab === "all" ? undefined : { status: tab });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Visits</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every visit, with status, evidence, and notes.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === t.key
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : data.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No visits.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">When</th>
                <th className="px-4 py-2.5 text-left font-medium">Participant</th>
                <th className="px-4 py-2.5 text-left font-medium">Worker</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {data.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => navigate(`/visits/${v.id}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(v.scheduled_start).toLocaleString("en-AU", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">{v.participant_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.worker_name ?? "Unallocated"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${statusBadge[v.status] ?? ""}`}>
                      {v.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={v.notes_submitted ? "text-success" : "text-muted-foreground"}>
                      Note {v.notes_submitted ? "✓" : "—"}
                    </span>
                    <span className="mx-2 text-border">·</span>
                    <span className={v.participant_signed ? "text-success" : "text-muted-foreground"}>
                      Signed {v.participant_signed ? "✓" : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}