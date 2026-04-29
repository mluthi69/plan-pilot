import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { toast } from "sonner";

export function useBookingGoals(bookingId?: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["booking_goals", orgId, bookingId],
    enabled: !!orgId && !!bookingId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("booking_goals")
        .select("goal_id")
        .eq("booking_id", bookingId);
      if (error) throw error;
      return ((data ?? []) as { goal_id: string }[]).map((r) => r.goal_id);
    },
  });
}

export function useReplaceBookingGoals() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: { booking_id: string; goal_ids: string[] }) => {
      if (!orgId) throw new Error("No organization");
      const { data: existing, error: exErr } = await (supabase as any)
        .from("booking_goals")
        .select("id, goal_id")
        .eq("booking_id", input.booking_id);
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
          booking_id: input.booking_id,
          goal_id: g,
        }));
      if (toDelete.length) {
        const { error } = await (supabase as any)
          .from("booking_goals")
          .delete()
          .in("id", toDelete);
        if (error) throw error;
      }
      if (toInsert.length) {
        const { error } = await (supabase as any)
          .from("booking_goals")
          .insert(toInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking_goals"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update booking goals"),
  });
}