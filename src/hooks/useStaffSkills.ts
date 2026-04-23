import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrg";
import { toast } from "sonner";

export type Proficiency = "trainee" | "competent" | "expert";

export interface StaffSkill {
  id: string;
  org_id: string;
  staff_id: string;
  support_category: string;
  proficiency: Proficiency;
  certified_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useStaffSkills(staffId: string | undefined) {
  return useQuery({
    queryKey: ["staff_skills", staffId],
    enabled: !!staffId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_skills")
        .select("*")
        .eq("staff_id", staffId!);
      if (error) throw error;
      return (data ?? []) as StaffSkill[];
    },
  });
}

export function useUpsertStaffSkill() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: {
      staff_id: string;
      support_category: string;
      proficiency?: Proficiency;
      certified_at?: string | null;
      expires_at?: string | null;
    }) => {
      if (!orgId) throw new Error("Missing organisation");
      const { data, error } = await supabase
        .from("staff_skills")
        .upsert(
          {
            org_id: orgId,
            staff_id: input.staff_id,
            support_category: input.support_category,
            proficiency: input.proficiency ?? "competent",
            certified_at: input.certified_at ?? null,
            expires_at: input.expires_at ?? null,
          },
          { onConflict: "staff_id,support_category" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as StaffSkill;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["staff_skills", data.staff_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveStaffSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, staff_id }: { id: string; staff_id: string }) => {
      const { error } = await supabase.from("staff_skills").delete().eq("id", id);
      if (error) throw error;
      return { staff_id };
    },
    onSuccess: ({ staff_id }) => {
      qc.invalidateQueries({ queryKey: ["staff_skills", staff_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}