import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Mail, Phone, Globe, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { useProvider, useDeleteProvider } from "@/hooks/useProviders";
import { useProviderInvoices } from "@/hooks/useInvoices";
import { useProviderContracts } from "@/hooks/useContracts";
import { useEntityActivity } from "@/hooks/useActivityLog";
import ProviderFormDialog from "@/components/ProviderFormDialog";
import { useProviderStats } from "@/hooks/useProviderStats";
import { checkAbn } from "@/lib/abn";
import { TrendingUp, DollarSign, Receipt, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const contractStatusStyle: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  expiring: "bg-warning/10 text-warning border-warning/20",
  expired: "bg-muted text-muted-foreground border-border",
};

export default function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: provider, isLoading } = useProvider(id);
  const { data: invoices = [] } = useProviderInvoices(id);
  const { data: contracts = [] } = useProviderContracts(id);
  const { data: activity = [] } = useEntityActivity("provider", id);
  const { data: stats } = useProviderStats(id);
  const deleteProvider = useDeleteProvider();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading provider...</div>
    );
  }

  if (!provider) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate("/providers")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Providers
        </button>
        <p className="text-muted-foreground">Provider not found.</p>
      </div>
    );
  }

  const handleDelete = () => {
    deleteProvider.mutate(provider.id, {
      onSuccess: () => navigate("/providers"),
    });
  };

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
              <Badge variant="outline" className={`text-[11px] font-medium capitalize ${provider.status === "active" ? "bg-success/10 text-success border-success/20" : provider.status === "pending" ? "bg-warning/10 text-warning border-warning/20" : "bg-muted text-muted-foreground border-border"}`}>
                {provider.status}
              </Badge>
              <Badge variant="outline" className={`text-[11px] font-medium capitalize ${provider.registration === "registered" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted text-muted-foreground border-border"}`}>
                {provider.registration}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">ABN: {provider.abn}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors">
              <MoreHorizontal className="h-4 w-4" />
              Actions
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowEdit(true)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit Provider
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setShowDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete Provider
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact strip */}
      <div className="flex flex-wrap gap-6 rounded-lg border border-border bg-card px-5 py-3 text-sm">
        {provider.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" /> {provider.email}
          </div>
        )}
        {provider.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" /> {provider.phone}
          </div>
        )}
        {provider.website && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" /> {provider.website}
          </div>
        )}
        {provider.address && (
          <div className="ml-auto text-muted-foreground">{provider.address}</div>
        )}
      </div>

      {/* Services */}
      {provider.services.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Services:</span>
          {provider.services.map((s) => (
            <span key={s} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{s}</span>
          ))}
        </div>
      )}

      {/* ABN verification + YTD stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">ABN status</p>
          {(() => {
            const c = checkAbn(provider.abn);
            return (
              <p className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${c.valid ? "text-success" : "text-destructive"}`}>
                {c.valid ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {c.valid ? "Verified" : "Invalid"}
              </p>
            );
          })()}
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">YTD invoiced</p>
          <p className="mt-1 text-sm font-semibold flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-muted-foreground" />${(stats?.ytdAmount ?? 0).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">YTD invoices</p>
          <p className="mt-1 text-sm font-semibold flex items-center gap-1.5"><Receipt className="h-4 w-4 text-muted-foreground" />{stats?.ytdInvoiceCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Outstanding</p>
          <p className={`mt-1 text-sm font-semibold flex items-center gap-1.5 ${(stats?.exceptionsCount ?? 0) > 0 ? "text-destructive" : ""}`}>
            {(stats?.exceptionsCount ?? 0) > 0 ? <AlertTriangle className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 text-muted-foreground" />}
            ${(stats?.outstandingAmount ?? 0).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity ({activity.length})</TabsTrigger>
          <TabsTrigger value="contracts">Contracts ({contracts.length})</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4">
          <div className="rounded-lg border border-border bg-card">
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No invoices yet</div>
            ) : (
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
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-card-foreground">{inv.invoice_number}</td>
                      <td className="px-5 py-3 text-muted-foreground">{inv.participant_name ?? "—"}</td>
                      <td className="px-5 py-3"><span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{inv.category}</span></td>
                      <td className="px-5 py-3 text-right font-medium text-card-foreground">${Number(inv.amount).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3 text-muted-foreground">{new Date(inv.received_at).toLocaleDateString("en-AU")}</td>
                      <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity recorded yet</p>
            ) : (
              activity.map((a, i) => (
                <div key={a.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-card-foreground">{a.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">by {a.performed_by ?? "System"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleDateString("en-AU")}</span>
                  </div>
                  {i < activity.length - 1 && <Separator className="mt-4" />}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="mt-4">
          <div className="rounded-lg border border-border bg-card">
            {contracts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No contracts yet</div>
            ) : (
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
                  {contracts.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-card-foreground">{c.title}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{c.start_date} → {c.end_date}</td>
                      <td className="px-5 py-3 text-right font-medium text-card-foreground">${Number(c.value).toLocaleString("en-AU", { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={`text-[11px] font-medium capitalize ${contractStatusStyle[c.status] || ""}`}>
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      {showEdit && <ProviderFormDialog open={showEdit} onOpenChange={setShowEdit} provider={provider} />}

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {provider.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this provider and all associated contracts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
