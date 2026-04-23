import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrg";
import { toast } from "sonner";

export type AvailabilityKind = "available" | "unavailable";

export interface AvailabilityRule {
  id: string;
  org_id: string;
  staff_id: string;
  day_of_week: number; // 0 Sun – 6 Sat
  starts_time: string; // 'HH:MM:SS'
  ends_time: string;
  effective_from: string | null;
  effective_to: string | null;
  kind: AvailabilityKind;
}

export interface AvailabilityException {
  id: string;
  org_id: string;
  staff_id: string;
  starts_at: string;
  ends_at: string;
  kind: AvailabilityKind;
  reason: string | null;
}

export function useStaffAvailability(staffId: string | undefined) {
  return useQuery({
    queryKey: ["staff_availability", staffId],
    enabled: !!staffId,
    queryFn: async () => {
      const [{ data: rules, error: e1 }, { data: exceptions, error: e2 }] = await Promise.all([
        supabase
          .from("staff_availability")
          .select("*")
          .eq("staff_id", staffId!)
          .order("day_of_week", { ascending: true })
          .order("starts_time", { ascending: true }),
        supabase
          .from("staff_availability_exception")
          .select("*")
          .eq("staff_id", staffId!)
          .order("starts_at", { ascending: true }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return {
        rules: (rules ?? []) as AvailabilityRule[],
        exceptions: (exceptions ?? []) as AvailabilityException[],
      };
    },
  });
}

export function useUpsertAvailabilityRule() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: Partial<AvailabilityRule> & { staff_id: string; day_of_week: number; starts_time: string; ends_time: string }) => {
      if (!orgId) throw new Error("Missing organisation");
      const payload = { ...input, org_id: orgId, kind: input.kind ?? "available" };
      const { data, error } = input.id
        ? await supabase.from("staff_availability").update(payload).eq("id", input.id).select().single()
        : await supabase.from("staff_availability").insert(payload).select().single();
      if (error) throw error;
      return data as AvailabilityRule;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["staff_availability", data.staff_id] });
      toast.success("Availability saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveAvailabilityRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, staff_id }: { id: string; staff_id: string }) => {
      const { error } = await supabase.from("staff_availability").delete().eq("id", id);
      if (error) throw error;
      return { staff_id };
    },
    onSuccess: ({ staff_id }) => {
      qc.invalidateQueries({ queryKey: ["staff_availability", staff_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpsertAvailabilityException() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: Partial<AvailabilityException> & { staff_id: string; starts_at: string; ends_at: string }) => {
      if (!orgId) throw new Error("Missing organisation");
      const payload = { ...input, org_id: orgId, kind: input.kind ?? "unavailable" };
      const { data, error } = input.id
        ? await supabase.from("staff_availability_exception").update(payload).eq("id", input.id).select().single()
        : await supabase.from("staff_availability_exception").insert(payload).select().single();
      if (error) throw error;
      return data as AvailabilityException;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["staff_availability", data.staff_id] });
      toast.success("Exception saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveAvailabilityException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, staff_id }: { id: string; staff_id: string }) => {
      const { error } = await supabase.from("staff_availability_exception").delete().eq("id", id);
      if (error) throw error;
      return { staff_id };
    },
    onSuccess: ({ staff_id }) => {
      qc.invalidateQueries({ queryKey: ["staff_availability", staff_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Half-hour validator used by booking insert. */
export function isHalfHourSlot(d: Date): boolean {
  return d.getSeconds() === 0 && d.getMilliseconds() === 0 && (d.getMinutes() === 0 || d.getMinutes() === 30);
}