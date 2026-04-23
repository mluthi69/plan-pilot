import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";

export interface BudgetCategory {
  id: string;
  org_id: string;
  participant_id: string;
  name: string;
  code: "Core" | "CB" | "Capital" | string;
  budget: number;
  sort_order: number;
}

/** Fetches budget categories for a participant, ordered by sort_order. */
export function useBudgetCategories(participantId: string | undefined) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["budget_categories", orgId, participantId],
    enabled: !!orgId && !!participantId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("plan_budget_categories")
        .select("*")
        .eq("participant_id", participantId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BudgetCategory[];
    },
  });
}