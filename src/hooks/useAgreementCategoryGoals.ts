import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { toast } from "sonner";

export interface AgreementCategoryGoalLink {
  id: string;
  org_id: string;
  agreement_category_id: string;
  goal_id: string;
}

/** All goal links across an agreement (one query, then filter client-side per category). */
export function useAgreementGoalLinks(agreementCategoryIds: string[] | undefined) {
  const orgId = useOrgId();
  const ids = (agreementCategoryIds ?? []).slice().sort().join(",");
  return useQuery({
    queryKey: ["agreement_category_goals", orgId, ids],
    enabled: !!orgId && (agreementCategoryIds?.length ?? 0) > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("funding_agreement_category_goals")
        .select("*")
        .in("agreement_category_id", agreementCategoryIds!);
      if (error) throw error;
      return (data ?? []) as AgreementCategoryGoalLink[];
    },
  });
}

/**
 * Replace the goal links for a single agreement category in one go
 * (delete missing, insert new).
 */
export function useReplaceAgreementCategoryGoals() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: { agreement_category_id: string; goal_ids: string[] }) => {
      if (!orgId) throw new Error("No organization");
      const { data: existing, error: exErr } = await (supabase as any)
        .from("funding_agreement_category_goals")
        .select("id, goal_id")
        .eq("agreement_category_id", input.agreement_category_id);
      if (exErr) throw exErr;
      const existingIds = new Map<string, string>(
        (existing ?? []).map((r: any) => [r.goal_id, r.id]),
      );
      const target = new Set(input.goal_ids);
      const toDelete: string[] = [];
      for (const [goalId, rowId] of existingIds.entries()) {
        if (!target.has(goalId)) toDelete.push(rowId);
      }
      const toInsert = input.goal_ids
        .filter((g) => !existingIds.has(g))
        .map((g) => ({
          org_id: orgId,
          agreement_category_id: input.agreement_category_id,
          goal_id: g,
        }));
      if (toDelete.length) {
        const { error } = await (supabase as any)
          .from("funding_agreement_category_goals")
          .delete()
          .in("id", toDelete);
        if (error) throw error;
      }
      if (toInsert.length) {
        const { error } = await (supabase as any)
          .from("funding_agreement_category_goals")
          .insert(toInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agreement_category_goals"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update linked goals"),
  });
}

/**
 * For a participant + support_category_code, return the goals linked to any
 * agreement category matching that NDIS code on an active agreement.
 * Falls back to all active participant goals if there are zero links.
 */
export function useGoalsForCategory(participantId?: string, supportCategoryCode?: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["goals_for_category", orgId, participantId, supportCategoryCode],
    enabled: !!orgId && !!participantId && !!supportCategoryCode,
    queryFn: async () => {
      // Find agreement_category_ids on active agreements for this participant + code.
      const { data: agrCats, error: catErr } = await (supabase as any)
        .from("funding_agreement_categories")
        .select(
          "id, agreement:agreement_id!inner(participant_id, status, org_id)",
        )
        .eq("support_category_code", supportCategoryCode)
        .eq("agreement.participant_id", participantId)
        .eq("agreement.org_id", orgId);
      if (catErr) throw catErr;
      const activeCatIds = (agrCats ?? [])
        .filter((c: any) => c.agreement?.status === "active")
        .map((c: any) => c.id);

      let linkedGoalIds: string[] = [];
      if (activeCatIds.length) {
        const { data: links, error: linkErr } = await (supabase as any)
          .from("funding_agreement_category_goals")
          .select("goal_id")
          .in("agreement_category_id", activeCatIds);
        if (linkErr) throw linkErr;
        linkedGoalIds = (links ?? []).map((l: any) => l.goal_id);
      }

      // Always fetch the participant's active goals for either filtering or fallback.
      const { data: allGoals, error: goalsErr } = await (supabase as any)
        .from("participant_goals")
        .select("*")
        .eq("org_id", orgId)
        .eq("participant_id", participantId)
        .eq("status", "active")
        .order("sort_order", { ascending: true });
      if (goalsErr) throw goalsErr;

      const goals = (allGoals ?? []) as any[];
      if (linkedGoalIds.length) {
        const set = new Set(linkedGoalIds);
        return { goals: goals.filter((g) => set.has(g.id)), linked: true };
      }
      return { goals, linked: false };
    },
  });
}