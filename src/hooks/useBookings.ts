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

/** Staff assignment as it appears on a Booking row. */
export type BookingStaffRole = "primary" | "support" | "shadow" | "observer";

export interface BookingStaff {
  /** staff_bookings link row id (useful for delete / role updates). */
  link_id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  display_name: string;
  role: BookingStaffRole;
  travel_minutes_before: number | null;
  travel_km_before: number | null;
  travel_from_label: string | null;
  travel_from_lat: number | null;
  travel_from_lng: number | null;
}

export interface Booking {
  id: string;
  org_id: string;
  participant_id: string;
  /** Embedded participant snapshot (joined). */
  participant: { id: string; name: string; address: string | null } | null;
  /** All assigned staff (many-to-many via staff_bookings). */
  staff: BookingStaff[];
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
  /** New richer location model. */
  location_kind: "participant_address" | "global_location" | "override";
  participant_address_id: string | null;
  location_id: string | null;
  /** Resolved coordinates of the booking's location (when known). */
  end_lat: number | null;
  end_lng: number | null;
  /** Resolved label/name (joined from participant_address.label or location.name). */
  resolved_location_name: string | null;
}

export interface BookingInput {
  participant_id: string;
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
  /** New richer location fields. */
  location_kind?: "participant_address" | "global_location" | "override";
  participant_address_id?: string | null;
  location_id?: string | null;
  end_lat?: number | null;
  end_lng?: number | null;
}

export function useBookings(range?: { from?: string; to?: string }) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["bookings", orgId, range?.from, range?.to],
    enabled: !!orgId,
    queryFn: async () => {
      let q = (supabase as any)
        .from("bookings")
        .select(`*,
          participants(name, address),
          participant_address:participant_address_id(id, label, address, lat, lng),
          location:location_id(id, name, address, lat, lng),
          staff_bookings(id, role, travel_minutes_before, travel_km_before, travel_from_label, travel_from_lat, travel_from_lng, staff:staff_id(id, first_name, last_name, preferred_name))`)
        .eq("org_id", orgId)
        .order("starts_at", { ascending: true });
      if (range?.from) q = q.gte("starts_at", range.from);
      if (range?.to) q = q.lte("starts_at", range.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((b: any) => {
        const sb: Array<{ id: string; role: BookingStaffRole; staff: any }> = b.staff_bookings ?? [];
        const staff: BookingStaff[] = sb
          .filter((row) => row.staff)
          .map((row: any) => {
            const first = row.staff.preferred_name?.trim() || row.staff.first_name;
            return {
              link_id: row.id,
              staff_id: row.staff.id,
              first_name: row.staff.first_name,
              last_name: row.staff.last_name,
              preferred_name: row.staff.preferred_name ?? null,
              display_name: `${first} ${row.staff.last_name}`.trim(),
              role: row.role,
              travel_minutes_before: row.travel_minutes_before ?? null,
              travel_km_before: row.travel_km_before ?? null,
              travel_from_label: row.travel_from_label ?? null,
              travel_from_lat: row.travel_from_lat ?? null,
              travel_from_lng: row.travel_from_lng ?? null,
            };
          })
          // Stable order: primary first, then support/shadow/observer, then by name.
          .sort((a, b) => {
            const rank = (r: BookingStaffRole) =>
              r === "primary" ? 0 : r === "support" ? 1 : r === "shadow" ? 2 : 3;
            return rank(a.role) - rank(b.role) || a.display_name.localeCompare(b.display_name);
          });
        const p = b.participants;
        const pa = b.participant_address;
        const loc = b.location;
        const resolved_location_name =
          b.location_kind === "participant_address" && pa
            ? `${(pa.label ?? "").charAt(0).toUpperCase()}${(pa.label ?? "").slice(1)}`
            : b.location_kind === "global_location" && loc
              ? loc.name
              : null;
        // Prefer joined coords; fall back to bookings.end_lat/lng.
        const end_lat =
          b.location_kind === "participant_address" ? pa?.lat ?? b.end_lat ?? null
          : b.location_kind === "global_location" ? loc?.lat ?? b.end_lat ?? null
          : b.end_lat ?? null;
        const end_lng =
          b.location_kind === "participant_address" ? pa?.lng ?? b.end_lng ?? null
          : b.location_kind === "global_location" ? loc?.lng ?? b.end_lng ?? null
          : b.end_lng ?? null;
        return {
          ...b,
          participant: p
            ? { id: b.participant_id, name: p.name, address: p.address ?? null }
            : null,
          staff,
          end_lat,
          end_lng,
          resolved_location_name,
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

      // Mirror schedule changes onto the linked visit.
      const visitPatch: any = {};
      if (patch.starts_at) visitPatch.scheduled_start = patch.starts_at;
      if (patch.ends_at) visitPatch.scheduled_end = patch.ends_at;
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