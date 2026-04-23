import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { toast } from "sonner";

export interface Participant {
  id: string;
  org_id: string;
  name: string;
  ndis_number: string;
  date_of_birth: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  plan_start: string | null;
  plan_end: string | null;
  total_budget: number;
  created_at: string;
  updated_at: string;
}

export function useParticipants() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["participants", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("participants")
        .select("*")
        .eq("org_id", orgId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Participant[];
    },
  });
}

export function useParticipant(id: string | undefined) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["participants", orgId, id],
    enabled: !!orgId && !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("participants")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Participant | null;
    },
  });
}

export function useCreateParticipant() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: Omit<Participant, "id" | "org_id" | "created_at" | "updated_at">) => {
      if (!orgId) throw new Error("No organization");
      const { data, error } = await (supabase as any)
        .from("participants")
        .insert({ ...input, org_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data as Participant;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["participants"] });
      toast.success("Participant added");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to add participant"),
  });
}