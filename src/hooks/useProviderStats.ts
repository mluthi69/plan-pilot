import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";

export interface ProviderStats {
  ytdInvoiceCount: number;
  ytdAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  exceptionsCount: number;
  byMonth: { month: string; amount: number }[];
}

export function useProviderStats(providerId: string | undefined) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["provider-stats", orgId, providerId],
    enabled: !!orgId && !!providerId,
    queryFn: async (): Promise<ProviderStats> => {
      const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const { data, error } = await (supabase as any)
        .from("invoices")
        .select("amount, status, received_at")
        .eq("org_id", orgId)
        .eq("provider_id", providerId)
        .gte("received_at", ytdStart);
      if (error) throw error;
      const rows = (data ?? []) as { amount: number; status: string; received_at: string }[];

      const byMonthMap = new Map<string, number>();
      let ytdAmount = 0;
      let paidAmount = 0;
      let outstandingAmount = 0;
      let exceptionsCount = 0;
      for (const r of rows) {
        const amt = Number(r.amount);
        ytdAmount += amt;
        if (r.status === "paid") paidAmount += amt;
        else if (r.status === "exception" || r.status === "rejected") exceptionsCount += 1;
        else outstandingAmount += amt;

        const d = new Date(r.received_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        byMonthMap.set(key, (byMonthMap.get(key) ?? 0) + amt);
      }
      const byMonth = Array.from(byMonthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount }));
      return {
        ytdInvoiceCount: rows.length,
        ytdAmount,
        paidAmount,
        outstandingAmount,
        exceptionsCount,
        byMonth,
      };
    },
  });
}