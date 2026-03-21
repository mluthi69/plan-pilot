import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus, Building2, CheckCircle2, XCircle, MoreHorizontal, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ProviderStatus = "active" | "inactive" | "pending";
type RegistrationType = "registered" | "unregistered";

interface Provider {
  id: string;
  name: string;
  abn: string;
  registration: RegistrationType;
  status: ProviderStatus;
  services: string[];
  participants: number;
  invoicesYtd: number;
  totalYtd: string;
  contact: string;
  email: string;
}

const providers: Provider[] = [
  { id: "PRV-101", name: "Allied Health Co", abn: "51 824 753 556", registration: "registered", status: "active", services: ["OT", "Physio", "Speech"], participants: 34, invoicesYtd: 187, totalYtd: "$142,800", contact: "Maria Santos", email: "accounts@alliedhealth.com.au" },
  { id: "PRV-102", name: "Care Connect Pty Ltd", abn: "23 456 789 012", registration: "registered", status: "active", services: ["Daily Living", "Community"], participants: 56, invoicesYtd: 312, totalYtd: "$267,500", contact: "Tom Bradley", email: "invoicing@careconnect.com.au" },
  { id: "PRV-103", name: "Therapy Plus", abn: "67 890 123 456", registration: "registered", status: "active", services: ["Psychology", "OT"], participants: 28, invoicesYtd: 145, totalYtd: "$98,200", contact: "Dr. Wei Lin", email: "admin@therapyplus.net.au" },
  { id: "PRV-104", name: "Support Works", abn: "34 567 890 123", registration: "unregistered", status: "active", services: ["Cleaning", "Gardening"], participants: 15, invoicesYtd: 89, totalYtd: "$34,100", contact: "Steve Park", email: "steve@supportworks.com.au" },
  { id: "PRV-105", name: "Mobility Assist Australia", abn: "78 901 234 567", registration: "registered", status: "active", services: ["AT", "Home Mods"], participants: 12, invoicesYtd: 43, totalYtd: "$189,300", contact: "Raj Patel", email: "billing@mobilityassist.com.au" },
  { id: "PRV-106", name: "OT Solutions", abn: "12 345 678 901", registration: "registered", status: "pending", services: ["OT"], participants: 0, invoicesYtd: 0, totalYtd: "$0", contact: "Amy Chen", email: "info@otsolutions.com.au" },
  { id: "PRV-107", name: "Physio First", abn: "45 678 901 234", registration: "unregistered", status: "active", services: ["Physio", "Exercise"], participants: 8, invoicesYtd: 62, totalYtd: "$28,400", contact: "Jake Morrison", email: "jake@physiofirst.com.au" },
  { id: "PRV-108", name: "Daily Living Aids", abn: "89 012 345 678", registration: "registered", status: "inactive", services: ["Consumables", "AT"], participants: 3, invoicesYtd: 12, totalYtd: "$8,900", contact: "Linda Hu", email: "orders@dailylivingaids.com.au" },
];

const statusStyles: Record<ProviderStatus, string> = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/10 text-warning border-warning/20",
};

export default function Providers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Providers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage service providers, ABN verification, and invoice routing</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Provider
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total Providers", value: "147", icon: Building2 },
          { label: "Registered", value: "98", icon: CheckCircle2 },
          { label: "Unregistered", value: "42", icon: XCircle },
          { label: "Pending Onboarding", value: "7", icon: ExternalLink },
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
          <input type="text" placeholder="Search by name, ABN, service..." className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
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
                <th className="px-5 py-2.5 text-left font-medium">Provider</th>
                <th className="px-5 py-2.5 text-left font-medium">ABN</th>
                <th className="px-5 py-2.5 text-left font-medium">Type</th>
                <th className="px-5 py-2.5 text-left font-medium">Services</th>
                <th className="px-5 py-2.5 text-right font-medium">Participants</th>
                <th className="px-5 py-2.5 text-right font-medium">Invoices YTD</th>
                <th className="px-5 py-2.5 text-right font-medium">Total YTD</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
                <th className="w-10 px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
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
                  <td className="px-5 py-3 text-right text-muted-foreground">{p.participants}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{p.invoicesYtd}</td>
                  <td className="px-5 py-3 text-right font-medium text-card-foreground">{p.totalYtd}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={`text-[11px] font-medium capitalize ${statusStyles[p.status]}`}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <button className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
