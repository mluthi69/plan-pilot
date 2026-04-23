import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GeocodeResult {
  formatted_address: string;
  lat: number;
  lng: number;
  place_id: string;
  cached?: boolean;
}

export function useGeocode() {
  return useMutation({
    mutationFn: async (address: string): Promise<GeocodeResult> => {
      const { data, error } = await supabase.functions.invoke("geocode-address", {
        body: { address },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as GeocodeResult;
    },
  });
}

export interface DistanceCell {
  status: string;
  km: number;
  minutes: number;
}
export interface Coord { lat: number; lng: number }

export function useDistanceMatrix() {
  return useMutation({
    mutationFn: async (args: {
      origins: Coord[];
      destinations: Coord[];
      mode?: "driving" | "walking";
    }): Promise<DistanceCell[][]> => {
      const { data, error } = await supabase.functions.invoke("distance-matrix", {
        body: args,
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      return (data as { rows: DistanceCell[][] }).rows;
    },
  });
}

export function useMapsConfig() {
  return useQuery({
    queryKey: ["maps-config"],
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<{ key: string }> => {
      const { data, error } = await supabase.functions.invoke("maps-config");
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { key: string };
    },
  });
}
