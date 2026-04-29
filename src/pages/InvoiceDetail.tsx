import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInvoice } from "@/hooks/useInvoices";
import { useInvoiceLines } from "@/hooks/useInvoiceLines";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id);
  const { data: lines = [] } = useInvoiceLines(id);

  if (isLoading || !invoice) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  const evidenceUrl = (token: string) =>
    `${window.location.origin}/evidence/${token}`;

  async function copyLink(token: string) {
    try {
      await navigator.clipboard.writeText(evidenceUrl(token));
      toast.success("Evidence pack link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-muted-foreground">{invoice.invoice_number}</p>
          <h1 className="text-2xl font-semibold">
            {invoice.participant?.name ?? invoice.provider?.name ?? "Invoice"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {invoice.line_count} line(s) · ${Number(invoice.amount).toFixed(2)} · received{" "}
            {new Date(invoice.received_at).toLocaleDateString("en-AU")}
          </p>
        </div>
        <StatusBadge status={invoice.status} />
      </header>

      <Card>
        <CardContent className="py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Lines & evidence packs</h2>
            <span className="text-xs text-muted-foreground">{lines.length} line(s)</span>
          </div>

          {lines.length === 0 ? (
            <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              No lines on this invoice yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">Item</th>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Rate</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                    <th className="px-3 py-2 text-left font-medium">Visit</th>
                    <th className="px-3 py-2 text-right font-medium">Evidence pack</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                        {l.support_item_code ?? "—"}
                      </td>
                      <td className="px-3 py-2">{l.description ?? "—"}</td>
                      <td className="px-3 py-2 text-right">{Number(l.quantity)} {l.unit}</td>
                      <td className="px-3 py-2 text-right">${Number(l.unit_price).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-medium">${Number(l.amount).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        {l.visit_id ? (
                          <Link
                            to={`/visits/${l.visit_id}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            View
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => copyLink(l.evidence_pack_token)}
                          >
                            <Copy className="mr-1 h-3 w-3" /> Copy link
                          </Button>
                          <a
                            href={evidenceUrl(l.evidence_pack_token)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-7 items-center rounded border border-border px-2 text-xs hover:bg-muted"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardContent className="py-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}