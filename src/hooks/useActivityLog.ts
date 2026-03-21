import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";

export interface ActivityEntry {
  id: string;
  action: string;
  performed_by: string | null;
  created_at: string;
}

export function useEntityActivity(entityType: string, entityId: string | undefined) {
  const orgId = useOrgId();

  return useQuery({
    queryKey: ["activity", orgId, entityType, entityId],
    enabled: !!orgId && !!entityId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("activity_log")
        .select("*")
        .eq("org_id", orgId)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ActivityEntry[];
    },
  });
}
