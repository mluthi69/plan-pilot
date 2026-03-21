import { useState } from "react";
import { Search, Filter, Plus, Upload } from "lucide-react";
import StatusBadge, { type InvoiceStatus } from "@/components/StatusBadge";
import { useInvoices, useInvoiceStats, useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const statusTransitions: Record<string, InvoiceStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["processing", "rejected"],
  processing: ["paid", "exception"],
  exception: ["processing", "rejected"],
};

export default function Invoices() {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: stats } = useInvoiceStats();
  const updateStatus = useUpdateInvoiceStatus();
  const [search, setSearch] = useState("");

  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.provider_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.participant_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Process, validate, and approve provider invoices</p>
        </div>
        <div className="flex items-center gap-2">
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
                      {statusTransitions[inv.status] ? (
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
