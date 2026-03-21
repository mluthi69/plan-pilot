import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";

export interface DashboardStats {
  activeParticipants: number;
  totalInvoicesThisMonth: number;
  pendingApprovals: number;
  totalClaimedThisMonth: number;
}

export function useDashboardStats() {
  const orgId = useOrgId();

  return useQuery({
    queryKey: ["dashboard-stats", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [participants, invoicesAll, invoicesMonth] = await Promise.all([
        (supabase as any).from("participants").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "active"),
        (supabase as any).from("invoices").select("status, amount").eq("org_id", orgId),
        (supabase as any).from("invoices").select("amount").eq("org_id", orgId).gte("received_at", startOfMonth),
      ]);

      const allInvoices = (invoicesAll.data ?? []) as { status: string; amount: number }[];
      const monthInvoices = (invoicesMonth.data ?? []) as { amount: number }[];

      return {
        activeParticipants: participants.count ?? 0,
        totalInvoicesThisMonth: monthInvoices.length,
        pendingApprovals: allInvoices.filter((i) => i.status === "pending").length,
        totalClaimedThisMonth: monthInvoices.reduce((s, i) => s + Number(i.amount), 0),
      } as DashboardStats;
    },
  });
}
