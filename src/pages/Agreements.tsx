import { Link } from "react-router-dom";
import { FileSignature, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgreements } from "@/hooks/useAgreements";

const statusBadge: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  pending_review: "bg-warning/15 text-warning-foreground border-warning/40",
  active: "bg-success/10 text-success border-success/30",
  expired: "bg-destructive/10 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function Agreements() {
  const { data = [], isLoading } = useAgreements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Service agreements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Linked to support items, pricing, and cancellation rules.</p>
        </div>
        <Button disabled>
          <Plus className="mr-1.5 h-4 w-4" />
          New agreement
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <FileSignature className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No agreements yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Agreements link participants to specific support items and rates. The builder ships in Slice 2.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-medium">Title</th>
                <th className="px-5 py-2.5 text-left font-medium">Participant</th>
                <th className="px-5 py-2.5 text-left font-medium">Period</th>
                <th className="px-5 py-2.5 text-right font-medium">Value</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3 font-medium">{a.title}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {a.participant_id ? (
                      <Link to={`/participants/${a.participant_id}`} className="hover:underline">
                        {a.participant_name ?? a.participant_id}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {new Date(a.start_date).toLocaleDateString("en-AU")} – {new Date(a.end_date).toLocaleDateString("en-AU")}
                  </td>
                  <td className="px-5 py-3 text-right font-medium">
                    ${Number(a.total_value).toLocaleString("en-AU")}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${statusBadge[a.status] ?? ""}`}>
                      {a.status.replace("_", " ")}
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