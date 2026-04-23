import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { toast } from "sonner";

/**
 * A "draft invoice candidate" is a completed visit that has not yet
 * been turned into an invoice line. We build them on the fly from the
 * visits + active service_agreements tables — no new schema needed.
 */
export interface DraftCandidate {
  visit_id: string;
  participant_id: string;
  participant_name: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  staff_names: string[];
  notes_submitted: boolean;
  participant_signed: boolean;
  agreement_id: string | null;
  agreement_title: string | null;
  item_code: string | null;
  unit_price: number | null;
  duration_hours: number;
  amount: number | null;
  warnings: string[];
}

function durationHours(start: string | null, end: string | null) {
  if (!start || !end) return 0;
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000);
}

export function useDraftInvoiceCandidates() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["draft-invoices", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      // Pull completed visits and active agreements in parallel
      const [visitsRes, agreementsRes] = await Promise.all([
        (supabase as any)
          .from("visits")
          .select(
            "*, participants(name), bookings!inner(staff_bookings(staff:staff_id(first_name, last_name, preferred_name)))"
          )
          .eq("org_id", orgId)
          .eq("status", "completed")
          .order("actual_end", { ascending: false }),
        (supabase as any)
          .from("service_agreements")
          .select("id, participant_id, title, status, start_date, end_date, items")
          .eq("org_id", orgId)
          .eq("status", "active"),
      ]);
      if (visitsRes.error) throw visitsRes.error;
      if (agreementsRes.error) throw agreementsRes.error;

      const visits = (visitsRes.data ?? []) as any[];
      const agreements = (agreementsRes.data ?? []) as any[];

      const candidates: DraftCandidate[] = visits.map((v) => {
        const agreement = agreements.find(
          (a) =>
            a.participant_id === v.participant_id &&
            new Date(a.start_date) <= new Date(v.scheduled_start) &&
            new Date(a.end_date) >= new Date(v.scheduled_start)
        );
        const firstItem = agreement?.items?.[0];
        const hours = durationHours(v.actual_start ?? v.scheduled_start, v.actual_end ?? v.scheduled_end);
        const unit = firstItem?.unit_price ?? null;
        const amount = unit != null ? Number((unit * hours).toFixed(2)) : null;

        const warnings: string[] = [];
        if (!agreement) warnings.push("No active service agreement covers this visit");
        if (!v.notes_submitted) warnings.push("Progress note not submitted");
        if (!v.participant_signed) warnings.push("Participant signature missing");
        if (hours <= 0) warnings.push("Visit duration is zero");
        if (!firstItem?.unit_price) warnings.push("Agreement has no priced items");

        const sb: Array<{ staff: any }> = v.bookings?.staff_bookings ?? [];
        const staff_names = sb
          .filter((row) => row.staff)
          .map((row) => {
            const first = row.staff.preferred_name?.trim() || row.staff.first_name;
            return `${first} ${row.staff.last_name}`.trim();
          });

        return {
          visit_id: v.id,
          participant_id: v.participant_id,
          participant_name: v.participants?.name ?? "—",
          scheduled_start: v.scheduled_start,
          scheduled_end: v.scheduled_end,
          actual_start: v.actual_start,
          actual_end: v.actual_end,
          staff_names,
          notes_submitted: v.notes_submitted,
          participant_signed: v.participant_signed,
          agreement_id: agreement?.id ?? null,
          agreement_title: agreement?.title ?? null,
          item_code: firstItem?.code ?? null,
          unit_price: unit,
          duration_hours: Number(hours.toFixed(2)),
          amount,
          warnings,
        };
      });

      return candidates;
    },
  });
}

export function useGenerateInvoiceFromVisit() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (c: DraftCandidate) => {
      if (!orgId) throw new Error("No organization");
      if (!c.amount || c.amount <= 0) throw new Error("Cannot invoice a $0 visit");
      const num = `INV-${Date.now().toString().slice(-8)}`;
      const { error } = await (supabase as any).from("invoices").insert({
        org_id: orgId,
        invoice_number: num,
        participant_id: c.participant_id,
        category: "Core",
        line_count: 1,
        amount: c.amount,
        status: "pending",
        notes: `Generated from visit ${c.visit_id} — ${c.item_code ?? "no code"} · ${c.duration_hours}h @ $${c.unit_price}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["draft-invoices"] });
      toast.success("Draft invoice created");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to generate invoice"),
  });
}