import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Plus, Upload, FileText, Download, Lock } from "lucide-react";
import { useDraftInvoiceCandidates } from "@/hooks/useDraftInvoices";
import StatusBadge, { type InvoiceStatus } from "@/components/StatusBadge";
import { useInvoices, useInvoiceStats, useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { buildClaimCsv, downloadCsv } from "@/lib/claimExport";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

const statusTransitions: Record<string, InvoiceStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["processing", "rejected"],
  processing: ["paid", "exception"],
  exception: ["processing", "rejected"],
};

export default function Invoices() {
  const { isFinance, role } = useUserRole();
  const { user } = useUser();
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: stats } = useInvoiceStats();
  const { data: drafts = [] } = useDraftInvoiceCandidates();
  const updateStatus = useUpdateInvoiceStatus();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.provider_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.participant_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const approvedReady = filtered.filter((i) => i.status === "approved");

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function exportSelected() {
    const rows = approvedReady
      .filter((i) => selected.has(i.id))
      .map((inv) => ({ invoice: inv, registrationNumber: null, supportNumber: null }));
    if (rows.length === 0) {
      toast.error("Select at least one approved invoice");
      return;
    }
    const csv = buildClaimCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`ndia-bulk-claim-${stamp}.csv`, csv);
    toast.success(`Exported ${rows.length} claim line${rows.length === 1 ? "" : "s"}`);
  }

  function approve(id: string) {
    updateStatus.mutate({
      id,
      status: "approved",
      approved_by: user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Finance",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Process, validate, and approve provider invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/invoices/drafts"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <FileText className="h-4 w-4" />
            Drafts
            {drafts.length > 0 && (
              <span className="rounded-full bg-warning/15 px-1.5 text-[10px] font-semibold text-warning">
                {drafts.length}
              </span>
            )}
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={exportSelected}
            disabled={!isFinance || selected.size === 0}
            title={isFinance ? "Export selected approved invoices as NDIA bulk CSV" : "Finance role required"}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export NDIA bulk ({selected.size})
          </Button>
          <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3.5 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            <Upload className="h-4 w-4" />
            Upload
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
            <Plus className="h-4 w-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-5">
        {[
          { label: "Total", count: stats?.total ?? 0, color: "text-card-foreground" },
          { label: "Pending", count: stats?.pending ?? 0, color: "text-warning" },
          { label: "Approved", count: stats?.approved ?? 0, color: "text-info" },
          { label: "Paid", count: stats?.paid ?? 0, color: "text-success" },
          { label: "Exceptions", count: stats?.exceptions ?? 0, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-3 text-center">
            <p className={`text-lg font-semibold ${s.color}`}>{s.count}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Loading invoices...</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              {search ? "No invoices match your search" : "No invoices yet"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="w-8 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={approvedReady.length > 0 && approvedReady.every((i) => selected.has(i.id))}
                      onChange={(e) => {
                        if (e.target.checked) setSelected(new Set(approvedReady.map((i) => i.id)));
                        else setSelected(new Set());
                      }}
                      disabled={!isFinance || approvedReady.length === 0}
                    />
                  </th>
                  <th className="px-5 py-2.5 text-left font-medium">Invoice</th>
                  <th className="px-5 py-2.5 text-left font-medium">Provider</th>
                  <th className="px-5 py-2.5 text-left font-medium">Participant</th>
                  <th className="px-5 py-2.5 text-left font-medium">Category</th>
                  <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                  <th className="px-5 py-2.5 text-left font-medium">Received</th>
                  <th className="px-5 py-2.5 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-3">
                      {inv.status === "approved" ? (
                        <input
                          type="checkbox"
                          checked={selected.has(inv.id)}
                          onChange={() => toggle(inv.id)}
                          disabled={!isFinance}
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs font-medium text-card-foreground">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-card-foreground">{inv.provider_name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{inv.participant_name ?? "—"}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{inv.category}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">
                      ${Number(inv.amount).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(inv.received_at).toLocaleDateString("en-AU")}</td>
                    <td className="px-5 py-3">
                      {inv.status === "pending" ? (
                        isFinance ? (
                          <Button size="sm" className="h-7 text-xs" onClick={() => approve(inv.id)}>
                            Approve
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Lock className="h-3 w-3" /> Finance approval
                          </span>
                        )
                      ) : statusTransitions[inv.status] ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              Update
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {statusTransitions[inv.status].map((next) => (
                              <DropdownMenuItem
                                key={next}
                                onClick={() => updateStatus.mutate({ id: inv.id, status: next })}
                              >
                                Mark as {next}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
