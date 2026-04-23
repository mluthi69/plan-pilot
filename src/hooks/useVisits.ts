import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { toast } from "sonner";

export type VisitStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "no_show"
  | "cancelled";

/** Embedded staff snapshot derived from staff_bookings on the parent booking. */
export interface VisitStaff {
  staff_id: string;
  display_name: string;
  role: "primary" | "support" | "shadow" | "observer";
}

export interface Visit {
  id: string;
  org_id: string;
  booking_id: string;
  participant_id: string;
  /** Embedded participant snapshot (joined). */
  participant: { id: string; name: string; address: string | null; phone: string | null } | null;
  /** Staff assigned to this visit's booking (joined via staff_bookings). */
  staff: VisitStaff[];
  status: VisitStatus;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  participant_signed: boolean;
  participant_signed_at: string | null;
  participant_signature_name: string | null;
  notes_submitted: boolean;
  exception_reason: string | null;
  created_at: string;
  updated_at: string;
  /** Resolved location for the visit's booking (for maps + route hints). */
  location_address: string | null;
  end_lat: number | null;
  end_lng: number | null;
}

export function useVisits(opts?: {
  /** Filter to visits where the given staff id is among the assigned staff. */
  staffId?: string | null;
  from?: string;
  to?: string;
  status?: VisitStatus;
}) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: [
      "visits",
      orgId,
      opts?.staffId ?? null,
      opts?.from ?? null,
      opts?.to ?? null,
      opts?.status ?? null,
    ],
    enabled: !!orgId,
    queryFn: async () => {
      let q = (supabase as any)
        .from("visits")
        .select(
          "*, participants(name, address, phone), bookings!inner(location_address, end_lat, end_lng, staff_bookings(role, staff:staff_id(id, first_name, last_name, preferred_name)))"
        )
        .eq("org_id", orgId)
        .order("scheduled_start", { ascending: true });
      if (opts?.from) q = q.gte("scheduled_start", opts.from);
      if (opts?.to) q = q.lte("scheduled_start", opts.to);
      if (opts?.status) q = q.eq("status", opts.status);
      const { data, error } = await q;
      if (error) throw error;
      const all: Visit[] = (data ?? []).map(mapVisitRow);
      // Client-side staff filter (Supabase can't filter on a nested 2-hop join).
      return opts?.staffId
        ? all.filter((v) => v.staff.some((s) => s.staff_id === opts.staffId))
        : all;
    },
  });
}

export function useVisit(id: string | undefined) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["visits", orgId, "single", id],
    enabled: !!orgId && !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("visits")
        .select(
          "*, participants(name, address, phone), bookings!inner(location_address, end_lat, end_lng, staff_bookings(role, staff:staff_id(id, first_name, last_name, preferred_name)))"
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapVisitRow(data);
    },
  });
}

export function useStartVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("visits")
        .update({
          status: "in_progress",
          actual_start: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast.success("Visit started");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to start visit"),
  });
}

export function useEndVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("visits")
        .update({
          status: "completed",
          actual_end: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast.success("Visit completed");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to complete visit"),
  });
}

export function useSignVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await (supabase as any)
        .from("visits")
        .update({
          participant_signed: true,
          participant_signed_at: new Date().toISOString(),
          participant_signature_name: name,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast.success("Signature captured");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to capture signature"),
  });
}

/** Flatten a Supabase visit row (with participant + nested staff_bookings) into a Visit. */
function mapVisitRow(v: any): Visit {
  const p = v.participants;
  const sb: Array<{ role: VisitStaff["role"]; staff: any }> =
    v.bookings?.staff_bookings ?? [];
  const staff: VisitStaff[] = sb
    .filter((row) => row.staff)
    .map((row) => {
      const first = row.staff.preferred_name?.trim() || row.staff.first_name;
      return {
        staff_id: row.staff.id,
        display_name: `${first} ${row.staff.last_name}`.trim(),
        role: row.role,
      };
    })
    .sort((a, b) => {
      const rank = (r: VisitStaff["role"]) =>
        r === "primary" ? 0 : r === "support" ? 1 : r === "shadow" ? 2 : 3;
      return rank(a.role) - rank(b.role) || a.display_name.localeCompare(b.display_name);
    });
  return {
    ...v,
    participant: p
      ? {
          id: v.participant_id,
          name: p.name,
          address: p.address ?? null,
          phone: p.phone ?? null,
        }
      : null,
    staff,
    location_address: v.bookings?.location_address ?? null,
    end_lat: v.bookings?.end_lat ?? null,
    end_lng: v.bookings?.end_lng ?? null,
  } as Visit;
}