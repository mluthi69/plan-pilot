import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { toast } from "sonner";

export interface OrgSettings {
  org_id: string;
  allow_unspent_rollover: boolean;
  require_geo_checkin: boolean;
  require_goal_contribution: boolean;
  default_period_length_months: number;
}

const DEFAULTS: Omit<OrgSettings, "org_id"> = {
  allow_unspent_rollover: false,
  require_geo_checkin: false,
  require_goal_contribution: false,
  default_period_length_months: 3,
};

export function useOrgSettings() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["org_settings", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<OrgSettings> => {
      const { data, error } = await (supabase as any)
        .from("org_settings")
        .select("*")
        .eq("org_id", orgId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { org_id: orgId!, ...DEFAULTS };
      return data as OrgSettings;
    },
  });
}

export function useUpdateOrgSettings() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<OrgSettings, "org_id">>) => {
      if (!orgId) throw new Error("No organization");
      const { error } = await (supabase as any)
        .from("org_settings")
        .upsert({ org_id: orgId, ...DEFAULTS, ...patch }, { onConflict: "org_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org_settings"] });
      toast.success("Settings saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save settings"),
  });
}
