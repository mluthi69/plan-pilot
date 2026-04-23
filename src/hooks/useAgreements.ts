import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { toast } from "sonner";

export type AgreementStatus = "draft" | "pending_review" | "active" | "expired" | "cancelled";

export interface AgreementItem {
  code?: string;
  description: string;
  unit_price: number;
  quantity: number;
  frequency?: string;
}

export interface ServiceAgreement {
  id: string;
  org_id: string;
  participant_id: string;
  participant_name?: string;
  title: string;
  status: AgreementStatus;
  start_date: string;
  end_date: string;
  total_value: number;
  cancellation_policy: string | null;
  travel_policy: string | null;
  items: AgreementItem[];
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useAgreements(participantId?: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["agreements", orgId, participantId],
    enabled: !!orgId,
    queryFn: async () => {
      let q = (supabase as any)
        .from("service_agreements")
        .select("*, participants(name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (participantId) q = q.eq("participant_id", participantId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        ...a,
        participant_name: a.participants?.name,
      })) as ServiceAgreement[];
    },
  });
}

export function useUpdateAgreementStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AgreementStatus }) => {
      const patch: any = { status };
      if (status === "active") patch.approved_at = new Date().toISOString();
      const { error } = await (supabase as any)
        .from("service_agreements")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agreements"] });
      toast.success("Agreement updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update agreement"),
  });
}