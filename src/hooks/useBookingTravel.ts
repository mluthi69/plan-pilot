import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrg";
import { toast } from "sonner";

export type TravelLineType = "provider_travel_labour" | "non_labour_transport";

export interface BookingTravelLine {
  id: string;
  org_id: string;
  booking_id: string;
  staff_booking_id: string | null;
  line_type: TravelLineType;
  minutes: number;
  kilometres: number;
  unit_rate: number | null;
  amount: number;
  support_item_code: string | null;
  mmm_zone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type BookingTravelLineInput = Omit<
  BookingTravelLine,
  "id" | "org_id" | "created_at" | "updated_at"
>;

export function useBookingTravelLines(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["booking_travel_lines", bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_travel_lines")
        .select("*")
        .eq("booking_id", bookingId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BookingTravelLine[];
    },
  });
}

export function useAllBookingTravelLines() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["booking_travel_lines", "all", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_travel_lines")
        .select("*")
        .eq("org_id", orgId!);
      if (error) throw error;
      return (data ?? []) as BookingTravelLine[];
    },
  });
}

export function useCreateTravelLine() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: BookingTravelLineInput) => {
      if (!orgId) throw new Error("Missing organisation");
      const { data, error } = await supabase
        .from("booking_travel_lines")
        .insert({ ...input, org_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data as BookingTravelLine;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["booking_travel_lines", data.booking_id] });
      qc.invalidateQueries({ queryKey: ["booking_travel_lines", "all"] });
      toast.success("Travel line added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTravelLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, patch,
    }: { id: string; patch: Partial<BookingTravelLineInput> }) => {
      const { data, error } = await supabase
        .from("booking_travel_lines")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as BookingTravelLine;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["booking_travel_lines", data.booking_id] });
      qc.invalidateQueries({ queryKey: ["booking_travel_lines", "all"] });
      toast.success("Travel line updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTravelLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, booking_id }: { id: string; booking_id: string }) => {
      const { error } = await supabase.from("booking_travel_lines").delete().eq("id", id);
      if (error) throw error;
      return { booking_id };
    },
    onSuccess: ({ booking_id }) => {
      qc.invalidateQueries({ queryKey: ["booking_travel_lines", booking_id] });
      qc.invalidateQueries({ queryKey: ["booking_travel_lines", "all"] });
      toast.success("Travel line removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Update travel-before fields on a staff_bookings row. */
export function useUpdateStaffBookingTravel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      travel_minutes_before: number | null;
      travel_km_before: number | null;
      travel_from_label?: string | null;
      travel_from_lat?: number | null;
      travel_from_lng?: number | null;
    }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("staff_bookings")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["staff_bookings", data.booking_id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Default NDIS unit rates for travel (rough — make configurable later). */
export const TRAVEL_RATES = {
  /** Provider travel - labour (per hour standard weekday) */
  provider_travel_labour_per_hour: 67.56,
  /** Non-labour transport per km */
  non_labour_per_km: 1.00,
};
