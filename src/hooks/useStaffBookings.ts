import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrg";
import { toast } from "sonner";

export type StaffBookingRole = "primary" | "support" | "shadow" | "observer";

export interface StaffBooking {
  id: string;
  org_id: string;
  booking_id: string;
  staff_id: string;
  role: StaffBookingRole;
  created_at: string;
  updated_at: string;
}

/** All staff currently assigned to a given booking. */
export function useStaffBookings(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["staff_bookings", bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_bookings")
        .select("*")
        .eq("booking_id", bookingId!);
      if (error) throw error;
      return (data ?? []) as StaffBooking[];
    },
  });
}

export function useAddStaffToBooking() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: {
      booking_id: string;
      staff_id: string;
      role?: StaffBookingRole;
    }) => {
      if (!orgId) throw new Error("Missing organisation");
      const { data, error } = await supabase
        .from("staff_bookings")
        .insert({
          org_id: orgId,
          booking_id: input.booking_id,
          staff_id: input.staff_id,
          role: input.role ?? "support",
        })
        .select()
        .single();
      if (error) throw error;
      return data as StaffBooking;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["staff_bookings", data.booking_id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Staff added to booking");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveStaffFromBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, booking_id }: { id: string; booking_id: string }) => {
      const { error } = await supabase.from("staff_bookings").delete().eq("id", id);
      if (error) throw error;
      return { booking_id };
    },
    onSuccess: ({ booking_id }) => {
      qc.invalidateQueries({ queryKey: ["staff_bookings", booking_id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Staff removed from booking");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateStaffBookingRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: StaffBookingRole }) => {
      const { data, error } = await supabase
        .from("staff_bookings")
        .update({ role })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as StaffBooking;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["staff_bookings", data.booking_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}