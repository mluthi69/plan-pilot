import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { toast } from "sonner";

export type BookingStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Booking {
  id: string;
  org_id: string;
  participant_id: string;
  participant_name?: string;
  assigned_worker_id: string | null;
  assigned_worker_name: string | null;
  service_type: string;
  support_item_code: string | null;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  location: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingInput {
  participant_id: string;
  assigned_worker_id?: string | null;
  assigned_worker_name?: string | null;
  service_type: string;
  support_item_code?: string | null;
  starts_at: string;
  ends_at: string;
  location?: string | null;
  notes?: string | null;
}

export function useBookings(range?: { from?: string; to?: string }) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["bookings", orgId, range?.from, range?.to],
    enabled: !!orgId,
    queryFn: async () => {
      let q = (supabase as any)
        .from("bookings")
        .select("*, participants(name)")
        .eq("org_id", orgId)
        .order("starts_at", { ascending: true });
      if (range?.from) q = q.gte("starts_at", range.from);
      if (range?.to) q = q.lte("starts_at", range.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((b: any) => ({
        ...b,
        participant_name: b.participants?.name,
      })) as Booking[];
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: BookingInput) => {
      if (!orgId) throw new Error("No organization");
      // Insert booking + matching visit in one batch.
      const { data: booking, error } = await (supabase as any)
        .from("bookings")
        .insert({ ...input, org_id: orgId })
        .select()
        .single();
      if (error) throw error;

      const { error: visitErr } = await (supabase as any).from("visits").insert({
        org_id: orgId,
        booking_id: booking.id,
        participant_id: booking.participant_id,
        worker_id: booking.assigned_worker_id,
        worker_name: booking.assigned_worker_name,
        scheduled_start: booking.starts_at,
        scheduled_end: booking.ends_at,
        status: "scheduled",
      });
      if (visitErr) throw visitErr;
      return booking as Booking;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast.success("Booking created");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create booking"),
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: BookingStatus;
      reason?: string;
    }) => {
      const patch: any = { status };
      if (status === "cancelled" && reason) patch.cancellation_reason = reason;
      const { error } = await (supabase as any)
        .from("bookings")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
      // Mirror status onto the linked visit.
      const visitStatus =
        status === "cancelled" || status === "no_show" ? status : undefined;
      if (visitStatus) {
        await (supabase as any)
          .from("visits")
          .update({ status: visitStatus })
          .eq("booking_id", id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast.success("Booking updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update booking"),
  });
}