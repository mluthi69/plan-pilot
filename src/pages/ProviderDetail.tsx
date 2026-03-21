import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Phone, Globe, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";

/* ── mock data ─────────────────────────────────────────────── */
const providerData: Record<string, any> = {
  "PRV-101": {
    id: "PRV-101", name: "Allied Health Co", abn: "51 824 753 556", registration: "registered", status: "active",
    services: ["OT", "Physio", "Speech"], contact: "Maria Santos", email: "accounts@alliedhealth.com.au",
    phone: "02 9123 4567", website: "alliedhealth.com.au", address: "12 Health St, Sydney NSW 2000",
    invoices: [
      { id: "INV-3001", participant: "Sarah Johnson", amount: "$1,240", date: "2025-06-12", status: "paid" as const, category: "Core" },
      { id: "INV-3002", participant: "James Wilson", amount: "$890", date: "2025-06-10", status: "pending" as const, category: "Capacity Building" },
      { id: "INV-3003", participant: "Emily Davis", amount: "$2,100", date: "2025-06-08", status: "paid" as const, category: "Core" },
      { id: "INV-3004", participant: "Michael Brown", amount: "$560", date: "2025-06-05", status: "rejected" as const, category: "Capital" },
    ],
    activity: [
      { date: "2025-06-12", action: "Invoice INV-3001 marked as paid", user: "System" },
      { date: "2025-06-10", action: "New invoice INV-3002 submitted", user: "Maria Santos" },
      { date: "2025-06-08", action: "Invoice INV-3003 approved", user: "Admin" },
      { date: "2025-06-01", action: "Service agreement renewed", user: "Admin" },
      { date: "2025-05-20", action: "Provider details updated", user: "Maria Santos" },
    ],
    contracts: [
      { id: "CON-201", title: "Core Supports – OT Services", start: "2025-01-01", end: "2025-12-31", value: "$120,000", status: "active" },
      { id: "CON-202", title: "Physiotherapy Services Agreement", start: "2025-03-01", end: "2026-02-28", value: "$85,000", status: "active" },
      { id: "CON-203", title: "Speech Pathology – Group Sessions", start: "2024-07-01", end: "2025-06-30", value: "$45,000", status: "expiring" },
    ],
  },
};

const getProvider = (id: string) => providerData[id] || providerData["PRV-101"];

const contractStatusStyle: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  expiring: "bg-warning/10 text-warning border-warning/20",
  expired: "bg-muted text-muted-foreground border-border",
};

/* ── component ────────────────────────────────────────────── */
export default function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const provider = getProvider(id || "");

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <button onClick={() => navigate("/providers")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Providers
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{provider.name}</h1>
              <Badge variant="outline" className={`text-[11px] font-medium capitalize ${provider.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}`}>
                {provider.status}
              </Badge>
              <Badge variant="outline" className={`text-[11px] font-medium capitalize ${provider.registration === "registered" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted text-muted-foreground border-border"}`}>
                {provider.registration}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">ABN: {provider.abn}</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors">
          <MoreHorizontal className="h-4 w-4" />
          Actions
        </button>
      </div>

      {/* Contact strip */}
      <div className="flex flex-wrap gap-6 rounded-lg border border-border bg-card px-5 py-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" /> {provider.email}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" /> {provider.phone}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Globe className="h-4 w-4" /> {provider.website}
        </div>
        <div className="ml-auto text-muted-foreground">
          {provider.address}
        </div>
      </div>

      {/* Services */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Services:</span>
        {provider.services.map((s: string) => (
          <span key={s} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s}</span>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4">
          <div className="rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-medium">Invoice</th>
                  <th className="px-5 py-2.5 text-left font-medium">Participant</th>
                  <th className="px-5 py-2.5 text-left font-medium">Category</th>
                  <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5 text-left font-medium">Date</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {provider.invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-card-foreground">{inv.id}</td>
                    <td className="px-5 py-3 text-muted-foreground">{inv.participant}</td>
                    <td className="px-5 py-3"><span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{inv.category}</span></td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">{inv.amount}</td>
                    <td className="px-5 py-3 text-muted-foreground">{inv.date}</td>
                    <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            {provider.activity.map((a: any, i: number) => (
              <div key={i}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-card-foreground">{a.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">by {a.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{a.date}</span>
                </div>
                {i < provider.activity.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="mt-4">
          <div className="rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-medium">Contract</th>
                  <th className="px-5 py-2.5 text-left font-medium">Period</th>
                  <th className="px-5 py-2.5 text-right font-medium">Value</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {provider.contracts.map((c: any) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-card-foreground">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.id}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{c.start} → {c.end}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">{c.value}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={`text-[11px] font-medium capitalize ${contractStatusStyle[c.status] || ""}`}>
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
