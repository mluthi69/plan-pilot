import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NdisCategory = {
  code: string;
  name: string;
  budget_bucket: "Core" | "Capacity Building" | "Capital";
  sort_order: number;
};

export function useNdisCategories() {
  return useQuery({
    queryKey: ["ndis_support_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ndis_support_categories")
        .select("code, name, budget_bucket, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as NdisCategory[];
    },
    staleTime: 1000 * 60 * 60,
  });
}