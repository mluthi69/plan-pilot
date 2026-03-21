import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";

export interface Contract {
  id: string;
  org_id: string;
  provider_id: string;
  title: string;
  start_date: string;
  end_date: string;
  value: number;
  status: "active" | "expiring" | "expired";
  created_at: string;
}

export function useProviderContracts(providerId: string | undefined) {
  const orgId = useOrgId();

  return useQuery({
    queryKey: ["contracts", orgId, providerId],
    enabled: !!orgId && !!providerId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("*")
        .eq("org_id", orgId)
        .eq("provider_id", providerId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
  });
}
