import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

export type VisitStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "no_show"
  | "cancelled";

export interface Visit {
  id: string;
  org_id: string;
  booking_id: string;
  participant_id: string;
  participant_name?: string;
  worker_id: string | null;
  worker_name: string | null;
  status: VisitStatus;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  participant_signed: boolean;
  participant_signed_at: string | null;
  participant_signature_name: string | null;
  notes_submitted: boolean;
  exception_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function useVisits(opts?: {
  workerId?: string | null;
  from?: string;
  to?: string;
  status?: VisitStatus;
}) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: [
      "visits",
      orgId,
      opts?.workerId ?? null,
      opts?.from ?? null,
      opts?.to ?? null,
      opts?.status ?? null,
    ],
    enabled: !!orgId,
    queryFn: async () => {
      let q = (supabase as any)
        .from("visits")
        .select("*, participants(name)")
        .eq("org_id", orgId)
        .order("scheduled_start", { ascending: true });
      if (opts?.workerId) q = q.eq("worker_id", opts.workerId);
      if (opts?.from) q = q.gte("scheduled_start", opts.from);
      if (opts?.to) q = q.lte("scheduled_start", opts.to);
      if (opts?.status) q = q.eq("status", opts.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((v: any) => ({
        ...v,
        participant_name: v.participants?.name,
      })) as Visit[];
    },
  });
}

export function useVisit(id: string | undefined) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["visits", orgId, "single", id],
    enabled: !!orgId && !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("visits")
        .select("*, participants(name, address, phone)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        participant_name: data.participants?.name,
      } as Visit & { participants?: any };
    },
  });
}

export function useStartVisit() {
  const qc = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("visits")
        .update({
          status: "in_progress",
          actual_start: new Date().toISOString(),
          worker_id: user?.id ?? undefined,
          worker_name: user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? undefined,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast.success("Visit started");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to start visit"),
  });
}

export function useEndVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("visits")
        .update({
          status: "completed",
          actual_end: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast.success("Visit completed");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to complete visit"),
  });
}

export function useSignVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await (supabase as any)
        .from("visits")
        .update({
          participant_signed: true,
          participant_signed_at: new Date().toISOString(),
          participant_signature_name: name,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast.success("Signature captured");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to capture signature"),
  });
}