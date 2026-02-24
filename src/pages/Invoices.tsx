import { Search, Filter, Plus, Upload } from "lucide-react";
import StatusBadge, { type InvoiceStatus } from "@/components/StatusBadge";

const invoices: { id: string; provider: string; abn: string; participant: string; lines: number; amount: string; status: InvoiceStatus; received: string; category: string }[] = [
  { id: "INV-2847", provider: "Allied Health Co", abn: "51 824 753 556", participant: "Sarah M.", lines: 3, amount: "$1,240.00", status: "pending", received: "24 Feb 2026", category: "Core" },
  { id: "INV-2846", provider: "Care Connect Pty", abn: "23 456 789 012", participant: "James T.", lines: 1, amount: "$856.50", status: "approved", received: "24 Feb 2026", category: "Core" },
  { id: "INV-2845", provider: "Therapy Plus", abn: "67 890 123 456", participant: "Anika R.", lines: 5, amount: "$2,100.00", status: "processing", received: "23 Feb 2026", category: "Capacity" },
  { id: "INV-2844", provider: "Support Works", abn: "34 567 890 123", participant: "David L.", lines: 2, amount: "$445.00", status: "paid", received: "23 Feb 2026", category: "Core" },
  { id: "INV-2843", provider: "Mobility Assist", abn: "78 901 234 567", participant: "Emma K.", lines: 4, amount: "$3,780.00", status: "exception", received: "22 Feb 2026", category: "Capital" },
  { id: "INV-2842", provider: "OT Solutions", abn: "12 345 678 901", participant: "Mohammad A.", lines: 2, amount: "$920.00", status: "paid", received: "22 Feb 2026", category: "Capacity" },
  { id: "INV-2841", provider: "Physio First", abn: "45 678 901 234", participant: "Lucy C.", lines: 1, amount: "$185.00", status: "approved", received: "21 Feb 2026", category: "Core" },
  { id: "INV-2840", provider: "Daily Living Aids", abn: "89 012 345 678", participant: "Robert N.", lines: 6, amount: "$4,210.00", status: "pending", received: "21 Feb 2026", category: "Capital" },
];

export default function Invoices() {
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
          { label: "Total", count: 387, color: "text-card-foreground" },
          { label: "Pending", count: 43, color: "text-warning" },
          { label: "Approved", count: 112, color: "text-info" },
          { label: "Paid", count: 224, color: "text-success" },
          { label: "Exceptions", count: 8, color: "text-destructive" },
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-medium">Invoice</th>
                <th className="px-5 py-2.5 text-left font-medium">Provider</th>
                <th className="px-5 py-2.5 text-left font-medium">ABN</th>
                <th className="px-5 py-2.5 text-left font-medium">Participant</th>
                <th className="px-5 py-2.5 text-left font-medium">Category</th>
                <th className="px-5 py-2.5 text-right font-medium">Lines</th>
                <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-left font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                  <td className="px-5 py-3 font-mono text-xs font-medium text-card-foreground">{inv.id}</td>
                  <td className="px-5 py-3 text-card-foreground">{inv.provider}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{inv.abn}</td>
                  <td className="px-5 py-3 text-muted-foreground">{inv.participant}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{inv.category}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{inv.lines}</td>
                  <td className="px-5 py-3 text-right font-medium text-card-foreground">{inv.amount}</td>
                  <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{inv.received}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
