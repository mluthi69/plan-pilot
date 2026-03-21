import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus, Building2, CheckCircle2, XCircle, MoreHorizontal, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProviders } from "@/hooks/useProviders";
import ProviderFormDialog from "@/components/ProviderFormDialog";

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/10 text-warning border-warning/20",
};

export default function Providers() {
  const navigate = useNavigate();
  const { data: providers = [], isLoading } = useProviders();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = providers.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.abn.includes(search) ||
      p.services.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const registered = providers.filter((p) => p.registration === "registered").length;
  const unregistered = providers.filter((p) => p.registration === "unregistered").length;
  const pending = providers.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Providers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage service providers, ABN verification, and invoice routing</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Provider
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total Providers", value: providers.length, icon: Building2 },
          { label: "Registered", value: registered, icon: CheckCircle2 },
          { label: "Unregistered", value: unregistered, icon: XCircle },
          { label: "Pending Onboarding", value: pending, icon: ExternalLink },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-card-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search/Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ABN, service..."
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
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Loading providers...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
              <Building2 className="h-8 w-8 mb-2 opacity-40" />
              <p>{search ? "No providers match your search" : "No providers yet. Add your first provider to get started."}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-medium">Provider</th>
                  <th className="px-5 py-2.5 text-left font-medium">ABN</th>
                  <th className="px-5 py-2.5 text-left font-medium">Type</th>
                  <th className="px-5 py-2.5 text-left font-medium">Services</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                  <th className="w-10 px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} onClick={() => navigate(`/providers/${p.id}`)} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <p className="font-medium text-card-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.contact} · {p.email}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{p.abn}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={`text-[11px] font-medium capitalize ${p.registration === "registered" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted text-muted-foreground border-border"}`}>
                        {p.registration}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.services.slice(0, 3).map((s) => (
                          <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={`text-[11px] font-medium capitalize ${statusStyles[p.status] || ""}`}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <button className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ProviderFormDialog open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
}
