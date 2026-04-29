import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";

export interface InvoiceLine {
  id: string;
  org_id: string;
  invoice_id: string;
  visit_id: string | null;
  support_item_code: string | null;
  support_category_code: string | null;
  description: string | null;
  unit: "hours" | "each" | "km" | string;
  quantity: number;
  unit_price: number;
  amount: number;
  evidence_pack_token: string;
  created_at: string;
}

export function useInvoiceLines(invoiceId?: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["invoice_lines", orgId, invoiceId],
    enabled: !!orgId && !!invoiceId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("invoice_lines")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as InvoiceLine[];
    },
  });
}
