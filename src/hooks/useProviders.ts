import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { toast } from "sonner";

export interface Provider {
  id: string;
  org_id: string;
  name: string;
  abn: string;
  registration: "registered" | "unregistered";
  status: "active" | "inactive" | "pending";
  services: string[];
  contact: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export type ProviderInsert = Omit<Provider, "id" | "created_at" | "updated_at">;

export function useProviders() {
  const orgId = useOrgId();

  return useQuery({
    queryKey: ["providers", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("providers")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Provider[];
    },
  });
}

export function useProvider(id: string | undefined) {
  const orgId = useOrgId();

  return useQuery({
    queryKey: ["providers", orgId, id],
    enabled: !!orgId && !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("providers")
        .select("*")
        .eq("id", id)
        .eq("org_id", orgId)
        .single();
      if (error) throw error;
      return data as Provider;
    },
  });
}

export function useCreateProvider() {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  return useMutation({
    mutationFn: async (provider: Omit<ProviderInsert, "org_id">) => {
      const { data, error } = await (supabase as any)
        .from("providers")
        .insert({ ...provider, org_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data as Provider;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Provider created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Provider> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("providers")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Provider;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Provider updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("providers")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Provider deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
