import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

export type GoalStatus = "active" | "achieved" | "discontinued";

export interface ParticipantGoal {
  id: string;
  org_id: string;
  participant_id: string;
  title: string;
  description: string | null;
  ndis_outcome_domain: string | null;
  status: GoalStatus;
  target_date: string | null;
  sort_order: number;
  created_at: string;
}

export const NDIS_OUTCOME_DOMAINS = [
  "Daily living",
  "Home",
  "Health & wellbeing",
  "Lifelong learning",
  "Work",
  "Social & community participation",
  "Relationships",
  "Choice & control",
] as const;

export function useParticipantGoals(participantId?: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["participant_goals", orgId, participantId],
    enabled: !!orgId && !!participantId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("participant_goals")
        .select("*")
        .eq("org_id", orgId)
        .eq("participant_id", participantId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ParticipantGoal[];
    },
  });
}

export function useUpsertGoal() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: Partial<ParticipantGoal> & { participant_id: string; title: string }) => {
      if (!orgId) throw new Error("No organization");
      if (input.id) {
        const { error } = await (supabase as any)
          .from("participant_goals")
          .update({ ...input })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("participant_goals")
          .insert({ ...input, org_id: orgId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["participant_goals"] });
      toast.success("Goal saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save goal"),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("participant_goals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["participant_goals"] });
      toast.success("Goal removed");
    },
  });
}

export interface VisitGoalContribution {
  id: string;
  org_id: string;
  visit_id: string;
  goal_id: string;
  contribution_note: string | null;
  progress_rating: number | null;
  created_at: string;
  goal?: ParticipantGoal | null;
}

export function useVisitGoalContributions(visitId?: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["visit_goal_contributions", orgId, visitId],
    enabled: !!orgId && !!visitId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("visit_goal_contributions")
        .select("*, goal:goal_id(*)")
        .eq("visit_id", visitId);
      if (error) throw error;
      return (data ?? []) as VisitGoalContribution[];
    },
  });
}

export function useUpsertVisitGoalContribution() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (input: {
      visit_id: string;
      goal_id: string;
      contribution_note?: string | null;
      progress_rating?: number | null;
    }) => {
      if (!orgId) throw new Error("No organization");
      const { error } = await (supabase as any)
        .from("visit_goal_contributions")
        .upsert(
          {
            ...input,
            org_id: orgId,
            created_by: user?.id ?? null,
          },
          { onConflict: "visit_id,goal_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit_goal_contributions"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save contribution"),
  });
}
