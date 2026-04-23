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
  /** All assigned staff (many-to-many via staff_bookings). */
  staff_ids: string[];
  staff_names: string[];
  support_category: string | null;
  location_address: string | null;
  location_source: "participant" | "override";
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
  /** Optional list of staff to attach when creating the booking. */
  staff_ids?: string[];
  support_category?: string | null;
  location_address?: string | null;
  location_source?: "participant" | "override";
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
        .select("*, participants(name, address), staff_bookings(staff:staff_id(id, first_name, last_name, preferred_name))")
        .eq("org_id", orgId)
        .order("starts_at", { ascending: true });
      if (range?.from) q = q.gte("starts_at", range.from);
      if (range?.to) q = q.lte("starts_at", range.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((b: any) => {
        const sb: Array<{ staff: any }> = b.staff_bookings ?? [];
        const staff_ids = sb.map((row) => row.staff?.id).filter(Boolean) as string[];
        const staff_names = sb
          .map((row) =>
            row.staff
              ? `${row.staff.preferred_name?.trim() || row.staff.first_name} ${row.staff.last_name}`.trim()
              : null
          )
          .filter(Boolean) as string[];
        return {
          ...b,
          participant_name: b.participants?.name,
          staff_ids,
          staff_names,
        };
      }) as Booking[];
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: BookingInput) => {
      if (!orgId) throw new Error("No organization");
      const { staff_ids, ...bookingFields } = input;
      // Insert booking + matching visit in one batch.
      const { data: booking, error } = await (supabase as any)
        .from("bookings")
        .insert({ ...bookingFields, org_id: orgId })
        .select()
        .single();
      if (error) throw error;

      // Attach assigned staff via the link table (many-to-many).
      if (staff_ids && staff_ids.length) {
        const rows = staff_ids.map((sid, i) => ({
          org_id: orgId,
          booking_id: booking.id,
          staff_id: sid,
          role: i === 0 ? "primary" : "support",
        }));
        const { error: linkErr } = await (supabase as any).from("staff_bookings").insert(rows);
        if (linkErr) throw linkErr;
      }

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

/**
 * Generic patch update for a booking (used by drag/resize/reassign in
 * the Scheduler view). Mirrors changes onto the linked visit so
 * downstream views stay consistent.
 */
export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<
        Pick<
          Booking,
          | "starts_at"
          | "ends_at"
          | "assigned_worker_id"
          | "assigned_worker_name"
          | "support_category"
          | "location_address"
          | "location_source"
          | "participant_id"
          | "service_type"
          | "location"
          | "notes"
        >
      >;
    }) => {
      const { error } = await (supabase as any)
        .from("bookings")
        .update(patch)
        .eq("id", id);
      if (error) throw error;

      // Mirror schedule + worker changes onto the linked visit.
      const visitPatch: any = {};
      if (patch.starts_at) visitPatch.scheduled_start = patch.starts_at;
      if (patch.ends_at) visitPatch.scheduled_end = patch.ends_at;
      if (patch.assigned_worker_id !== undefined) visitPatch.worker_id = patch.assigned_worker_id;
      if (patch.assigned_worker_name !== undefined) visitPatch.worker_name = patch.assigned_worker_name;
      if (Object.keys(visitPatch).length) {
        await (supabase as any).from("visits").update(visitPatch).eq("booking_id", id);
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