import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { toast } from "sonner";
import type { FundingPeriod } from "@/lib/fundingPeriods";

export type FundingAgreementStatus = "draft" | "active" | "expired" | "cancelled";

export interface FundingAgreementCategoryRow {
  id: string;
  agreement_id: string;
  support_category_code: string;
  total_amount: number;
  periods?: FundingPeriod[];
}

export interface FundingAgreement {
  id: string;
  org_id: string;
  participant_id: string;
  title: string;
  status: FundingAgreementStatus;
  start_date: string;
  end_date: string;
  period_length_months: number;
  allow_unspent_rollover: boolean | null;
  notes: string | null;
  categories: FundingAgreementCategoryRow[];
}

export function useFundingAgreements(participantId?: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["funding_agreements", orgId, participantId],
    enabled: !!orgId,
    queryFn: async () => {
      let q = (supabase as any)
        .from("funding_agreements")
        .select(
          "*, funding_agreement_categories(*, funding_periods(*))",
        )
        .eq("org_id", orgId)
        .order("start_date", { ascending: false });
      if (participantId) q = q.eq("participant_id", participantId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        ...a,
        categories: (a.funding_agreement_categories ?? []).map((c: any) => ({
          ...c,
          periods: (c.funding_periods ?? []).sort(
            (x: FundingPeriod, y: FundingPeriod) => x.period_index - y.period_index,
          ),
        })),
      })) as FundingAgreement[];
    },
  });
}

export interface FundingAgreementInput {
  participant_id: string;
  title: string;
  start_date: string;
  end_date: string;
  period_length_months: number;
  allow_unspent_rollover: boolean | null;
  status?: FundingAgreementStatus;
  notes?: string | null;
  categories: { support_category_code: string; total_amount: number }[];
}

export function useCreateFundingAgreement() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: FundingAgreementInput) => {
      if (!orgId) throw new Error("No organization");
      const { categories, ...agreementFields } = input;
      const { data: agr, error } = await (supabase as any)
        .from("funding_agreements")
        .insert({ ...agreementFields, org_id: orgId, status: input.status ?? "active" })
        .select()
        .single();
      if (error) throw error;

      if (categories.length) {
        const rows = categories.map((c) => ({
          org_id: orgId,
          agreement_id: agr.id,
          support_category_code: c.support_category_code,
          total_amount: c.total_amount,
        }));
        const { data: insertedCats, error: catErr } = await (supabase as any)
          .from("funding_agreement_categories")
          .insert(rows)
          .select("id, support_category_code");
        if (catErr) throw catErr;
        return { ...agr, inserted_categories: insertedCats ?? [] };
      }
      return { ...agr, inserted_categories: [] as Array<{ id: string; support_category_code: string }> };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funding_agreements"] });
      toast.success("Funding agreement created");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create agreement"),
  });
}

export function useUpdateFundingAgreementStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FundingAgreementStatus }) => {
      const { error } = await (supabase as any)
        .from("funding_agreements")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funding_agreements"] });
      toast.success("Agreement updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update"),
  });
}

export interface FundingAgreementUpdate {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  period_length_months: number;
  allow_unspent_rollover: boolean | null;
  status: FundingAgreementStatus;
  notes?: string | null;
  categories: { id?: string; support_category_code: string; total_amount: number }[];
}

/**
 * Full update of a funding agreement plus its categories.
 * Strategy: update the agreement, upsert provided categories, delete categories
 * that were removed. The DB triggers will regenerate funding_periods.
 */
export function useUpdateFundingAgreement() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  return useMutation({
    mutationFn: async (input: FundingAgreementUpdate) => {
      if (!orgId) throw new Error("No organization");
      const { id, categories, ...fields } = input;

      const { error: agrErr } = await (supabase as any)
        .from("funding_agreements")
        .update(fields)
        .eq("id", id);
      if (agrErr) throw agrErr;

      // Load existing category ids to know what to delete.
      const { data: existing, error: exErr } = await (supabase as any)
        .from("funding_agreement_categories")
        .select("id")
        .eq("agreement_id", id);
      if (exErr) throw exErr;
      const existingIds = new Set((existing ?? []).map((r: any) => r.id));
      const keptIds = new Set(categories.filter((c) => c.id).map((c) => c.id!));
      const toDelete = [...existingIds].filter((x) => !keptIds.has(x as string));

      if (toDelete.length) {
        const { error: delErr } = await (supabase as any)
          .from("funding_agreement_categories")
          .delete()
          .in("id", toDelete);
        if (delErr) throw delErr;
      }

      // Update existing rows.
      for (const c of categories) {
        if (c.id) {
          const { error } = await (supabase as any)
            .from("funding_agreement_categories")
            .update({
              support_category_code: c.support_category_code,
              total_amount: c.total_amount,
            })
            .eq("id", c.id);
          if (error) throw error;
        }
      }
      // Insert new rows.
      const newRows = categories
        .filter((c) => !c.id)
        .map((c) => ({
          org_id: orgId,
          agreement_id: id,
          support_category_code: c.support_category_code,
          total_amount: c.total_amount,
        }));
      if (newRows.length) {
        const { error } = await (supabase as any)
          .from("funding_agreement_categories")
          .insert(newRows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funding_agreements"] });
      qc.invalidateQueries({ queryKey: ["funding_spend"] });
      toast.success("Agreement updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update agreement"),
  });
}

export function useDeleteFundingAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("funding_agreements")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funding_agreements"] });
      toast.success("Agreement deleted");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete agreement"),
  });
}

/**
 * Returns spend per funding_period_id derived from existing bookings
 * (quantity × unit_price) within each period for the given participant.
 * Bookings with no quantity/price are ignored.
 */
export function useFundingSpend(participantId?: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["funding_spend", orgId, participantId],
    enabled: !!orgId && !!participantId,
    queryFn: async () => {
      // Pull bookings (with category, dates, qty/price) and the agreements/periods.
      const [bookingsRes, agreementsRes] = await Promise.all([
        (supabase as any)
          .from("bookings")
          .select("id, support_category, starts_at, quantity, unit_price, status")
          .eq("org_id", orgId)
          .eq("participant_id", participantId)
          .neq("status", "cancelled"),
        (supabase as any)
          .from("funding_agreements")
          .select(
            "id, status, funding_agreement_categories(id, support_category_code, funding_periods(id, period_index, period_start, period_end, allocated_amount, agreement_category_id))",
          )
          .eq("org_id", orgId)
          .eq("participant_id", participantId),
      ]);
      if (bookingsRes.error) throw bookingsRes.error;
      if (agreementsRes.error) throw agreementsRes.error;

      const periodsByCat: Record<string, FundingPeriod[]> = {};
      for (const a of agreementsRes.data ?? []) {
        if (a.status !== "active") continue;
        for (const c of a.funding_agreement_categories ?? []) {
          periodsByCat[c.support_category_code] = (c.funding_periods ?? []).sort(
            (x: FundingPeriod, y: FundingPeriod) => x.period_index - y.period_index,
          );
        }
      }

      const spend: Record<string, number> = {};
      for (const b of bookingsRes.data ?? []) {
        const code = b.support_category;
        if (!code) continue;
        const periods = periodsByCat[code];
        if (!periods) continue;
        const t = new Date(b.starts_at).getTime();
        const period = periods.find((p) => {
          const s = new Date(p.period_start).getTime();
          const e = new Date(p.period_end + "T23:59:59").getTime();
          return t >= s && t <= e;
        });
        if (!period) continue;
        const amount = Number(b.quantity ?? 0) * Number(b.unit_price ?? 0);
        if (amount > 0) {
          spend[period.id] = (spend[period.id] ?? 0) + amount;
        }
      }
      return { spendByPeriod: spend, periodsByCategory: periodsByCat };
    },
  });
}
