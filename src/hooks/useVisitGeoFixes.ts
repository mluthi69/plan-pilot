import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

export type GeoFixKind = "check_in" | "check_out" | "midpoint";

export interface VisitGeoFix {
  id: string;
  visit_id: string;
  kind: GeoFixKind;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  captured_at: string;
  captured_by: string | null;
}

export function useVisitGeoFixes(visitId?: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["visit_geo_fixes", orgId, visitId],
    enabled: !!orgId && !!visitId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("visit_geo_fixes")
        .select("*")
        .eq("visit_id", visitId)
        .order("captured_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as VisitGeoFix[];
    },
  });
}

export function useCaptureGeoFix() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  const { user } = useUser();
  return useMutation({
    mutationFn: async ({ visitId, kind }: { visitId: string; kind: GeoFixKind }) => {
      if (!orgId) throw new Error("No organization");
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("Geolocation not available"));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,
        });
      });
      const { error } = await (supabase as any).from("visit_geo_fixes").insert({
        org_id: orgId,
        visit_id: visitId,
        kind,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy,
        captured_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visit_geo_fixes"] });
      toast.success("Location captured");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not capture location"),
  });
}
