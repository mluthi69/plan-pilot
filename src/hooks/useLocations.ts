import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrg";
import { toast } from "sonner";

export type LocationType = "office" | "clinic" | "community" | "school" | "shc" | "sda" | "other";

export interface AppLocation {
  id: string;
  org_id: string;
  name: string;
  address: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  location_type: LocationType;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type LocationInput = Omit<AppLocation, "id" | "org_id" | "created_at" | "updated_at">;

export function useLocations(opts: { activeOnly?: boolean } = {}) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["locations", orgId, opts.activeOnly ?? false],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase.from("locations").select("*").eq("org_id", orgId!).order("name");
      if (opts.activeOnly) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AppLocation[];
    },
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: LocationInput) => {
      if (!orgId) throw new Error("Missing organisation");
      const { data, error } = await supabase
        .from("locations")
        .insert({ ...input, org_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data as AppLocation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<LocationInput> }) => {
      const { data, error } = await supabase
        .from("locations").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as AppLocation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
