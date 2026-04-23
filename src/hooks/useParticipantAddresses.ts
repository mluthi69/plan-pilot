import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrg";
import { toast } from "sonner";

export type AddressLabel = "home" | "work" | "respite" | "school" | "family" | "other";

export interface ParticipantAddress {
  id: string;
  org_id: string;
  participant_id: string;
  label: AddressLabel;
  address: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ParticipantAddressInput = Omit<
  ParticipantAddress,
  "id" | "org_id" | "created_at" | "updated_at"
>;

export function useParticipantAddresses(participantId: string | undefined) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["participant_addresses", orgId, participantId],
    enabled: !!orgId && !!participantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participant_addresses")
        .select("*")
        .eq("org_id", orgId!)
        .eq("participant_id", participantId!)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ParticipantAddress[];
    },
  });
}

export function useCreateParticipantAddress() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: ParticipantAddressInput) => {
      if (!orgId) throw new Error("Missing organisation");
      // If marking primary, demote others first
      if (input.is_primary) {
        await supabase
          .from("participant_addresses")
          .update({ is_primary: false })
          .eq("participant_id", input.participant_id);
      }
      const { data, error } = await supabase
        .from("participant_addresses")
        .insert({ ...input, org_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data as ParticipantAddress;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["participant_addresses"] });
      toast.success("Address added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateParticipantAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      participant_id,
      patch,
    }: {
      id: string;
      participant_id: string;
      patch: Partial<ParticipantAddressInput>;
    }) => {
      if (patch.is_primary) {
        await supabase
          .from("participant_addresses")
          .update({ is_primary: false })
          .eq("participant_id", participant_id)
          .neq("id", id);
      }
      const { data, error } = await supabase
        .from("participant_addresses")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ParticipantAddress;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["participant_addresses"] });
      toast.success("Address updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteParticipantAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("participant_addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["participant_addresses"] });
      toast.success("Address removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
