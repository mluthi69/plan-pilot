import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { toast } from "sonner";
import type { InvoiceStatus } from "@/components/StatusBadge";

export interface Invoice {
  id: string;
  org_id: string;
  invoice_number: string;
  provider_id: string | null;
  participant_id: string | null;
  category: "Core" | "Capacity Building" | "Capital";
  line_count: number;
  amount: number;
  status: InvoiceStatus;
  submitted_by: string | null;
  approved_by: string | null;
  received_at: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  provider_name?: string;
  participant_name?: string;
  provider_abn?: string;
}

export function useInvoices() {
  const orgId = useOrgId();

  return useQuery({
    queryKey: ["invoices", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("invoices")
        .select("*, providers(name, abn), participants(name)")
        .eq("org_id", orgId)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((inv) => ({
        ...inv,
        provider_name: inv.providers?.name ?? null,
        provider_abn: inv.providers?.abn ?? null,
        participant_name: inv.participants?.name ?? null,
      })) as Invoice[];
    },
  });
}

export function useProviderInvoices(providerId: string | undefined) {
  const orgId = useOrgId();

  return useQuery({
    queryKey: ["invoices", orgId, "provider", providerId],
    enabled: !!orgId && !!providerId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("invoices")
        .select("*, participants(name)")
        .eq("org_id", orgId)
        .eq("provider_id", providerId)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((inv) => ({
        ...inv,
        participant_name: inv.participants?.name ?? null,
      })) as Invoice[];
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: async (invoice: Omit<Invoice, "id" | "org_id" | "created_at" | "updated_at" | "provider_name" | "participant_name" | "provider_abn">) => {
      const { data, error } = await (supabase as any)
        .from("invoices")
        .insert({ ...invoice, org_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, approved_by }: { id: string; status: InvoiceStatus; approved_by?: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (approved_by) updates.approved_by = approved_by;
      if (status === "paid") updates.paid_at = new Date().toISOString();
      const { data, error } = await (supabase as any)
        .from("invoices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice status updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useInvoiceStats() {
  const orgId = useOrgId();

  return useQuery({
    queryKey: ["invoice-stats", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("invoices")
        .select("status, amount")
        .eq("org_id", orgId);
      if (error) throw error;
      const invoices = data as { status: string; amount: number }[];
      return {
        total: invoices.length,
        pending: invoices.filter((i) => i.status === "pending").length,
        approved: invoices.filter((i) => i.status === "approved").length,
        paid: invoices.filter((i) => i.status === "paid").length,
        exceptions: invoices.filter((i) => i.status === "exception" || i.status === "rejected").length,
        totalAmount: invoices.reduce((sum, i) => sum + Number(i.amount), 0),
        paidAmount: invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + Number(i.amount), 0),
      };
    },
  });
}
