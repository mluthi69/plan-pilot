import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileText, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDraftInvoiceCandidates,
  useGenerateInvoiceFromVisit,
  type DraftCandidate,
} from "@/hooks/useDraftInvoices";

function fmtTime(s: string) {
  return new Date(s).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InvoiceDrafts() {
  const { data: candidates = [], isLoading } = useDraftInvoiceCandidates();
  const generate = useGenerateInvoiceFromVisit();

  const ready = candidates.filter((c) => c.warnings.length === 0 && c.amount && c.amount > 0);
  const blocked = candidates.filter((c) => c.warnings.length > 0 || !c.amount);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/invoices" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-1 h-3 w-3" /> Back to invoices
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Draft invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completed visits, ready to invoice. We pull pricing from the active service agreement.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Visits to invoice" count={candidates.length} tone="muted" />
        <Stat label="Ready" count={ready.length} tone="success" />
        <Stat label="Blocked" count={blocked.length} tone="warning" />
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card py-10 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Nothing to invoice</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Drafts appear here when visits are completed.
            </p>
          </div>
        </div>
      ) : (
        <>
          {ready.length > 0 && (
            <Section title="Ready to invoice" tone="success">
              <CandidateTable candidates={ready} onGenerate={(c) => generate.mutate(c)} pending={generate.isPending} />
            </Section>
          )}
          {blocked.length > 0 && (
            <Section title="Needs attention" tone="warning">
              <CandidateTable candidates={blocked} onGenerate={(c) => generate.mutate(c)} pending={generate.isPending} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, count, tone }: { label: string; count: number; tone: "success" | "warning" | "muted" }) {
  const color = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className={`text-2xl font-semibold ${color}`}>{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone: "success" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : AlertTriangle;
  const color = tone === "success" ? "text-success" : "text-warning";
  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className={`h-4 w-4 ${color}`} />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CandidateTable({
  candidates,
  onGenerate,
  pending,
}: {
  candidates: DraftCandidate[];
  onGenerate: (c: DraftCandidate) => void;
  pending: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="px-4 py-2 text-left font-medium">Visit</th>
            <th className="px-4 py-2 text-left font-medium">Participant</th>
            <th className="px-4 py-2 text-left font-medium">Worker</th>
            <th className="px-4 py-2 text-left font-medium">Item</th>
            <th className="px-4 py-2 text-right font-medium">Hours</th>
            <th className="px-4 py-2 text-right font-medium">Amount</th>
            <th className="px-4 py-2 text-left font-medium">Issues</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.visit_id} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                <Link to={`/visits/${c.visit_id}`} className="hover:text-foreground hover:underline">
                  {fmtTime(c.scheduled_start)}
                </Link>
              </td>
              <td className="px-4 py-2.5 font-medium">{c.participant_name}</td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {c.staff_names.length === 0
                  ? "—"
                  : c.staff_names[0] +
                    (c.staff_names.length > 1 ? ` +${c.staff_names.length - 1}` : "")}
              </td>
              <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                {c.item_code ?? <span className="italic text-warning">no agreement</span>}
              </td>
              <td className="px-4 py-2.5 text-right">{c.duration_hours}</td>
              <td className="px-4 py-2.5 text-right font-medium">
                {c.amount != null ? `$${c.amount.toFixed(2)}` : "—"}
              </td>
              <td className="px-4 py-2.5">
                {c.warnings.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-success">
                    <CheckCircle2 className="h-3 w-3" /> Clear
                  </span>
                ) : (
                  <ul className="space-y-0.5">
                    {c.warnings.slice(0, 2).map((w) => (
                      <li key={w} className="flex items-start gap-1 text-[11px] text-warning">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                    {c.warnings.length > 2 && (
                      <li className="text-[11px] text-muted-foreground">+{c.warnings.length - 2} more</li>
                    )}
                  </ul>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                <Button
                  size="sm"
                  variant={c.warnings.length === 0 ? "default" : "outline"}
                  disabled={pending || !c.amount || c.amount <= 0}
                  onClick={() => onGenerate(c)}
                >
                  Generate
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}