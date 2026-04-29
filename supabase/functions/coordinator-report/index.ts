// Public Support Coordinator report endpoint.
// Looks up a participant by `coord_report_token` and returns aggregated
// goal progress, visit attribution, and category spend within a window.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!token) {
      return new Response(JSON.stringify({ error: "token required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: participant, error: pErr } = await sb
      .from("participants")
      .select("id, name, ndis_number, plan_start, plan_end, org_id")
      .eq("coord_report_token", token)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!participant) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromIso = from ? new Date(from).toISOString() : null;
    const toIso = to ? new Date(to + "T23:59:59").toISOString() : null;

    // Goals
    const { data: goals } = await sb
      .from("participant_goals")
      .select("id, title, description, ndis_outcome_domain, status, target_date")
      .eq("participant_id", participant.id)
      .order("sort_order", { ascending: true });

    // Visits in window
    let visitsQ = sb
      .from("visits")
      .select(
        "id, scheduled_start, scheduled_end, actual_start, actual_end, booking_id, bookings(support_category)",
      )
      .eq("participant_id", participant.id);
    if (fromIso) visitsQ = visitsQ.gte("scheduled_start", fromIso);
    if (toIso) visitsQ = visitsQ.lte("scheduled_start", toIso);
    const { data: visits } = await visitsQ;

    const visitIds = (visits ?? []).map((v: any) => v.id);
    const { data: contribs } = visitIds.length
      ? await sb
          .from("visit_goal_contributions")
          .select("visit_id, goal_id, progress_rating, contribution_note, created_at")
          .in("visit_id", visitIds)
      : { data: [] as any[] };

    // Active funding agreements + categories + periods
    const { data: agreements } = await sb
      .from("funding_agreements")
      .select(
        "id, title, status, start_date, end_date, funding_agreement_categories(id, support_category_code, total_amount)",
      )
      .eq("participant_id", participant.id)
      .eq("status", "active");

    // Spend per category from bookings in window
    let bookingsQ = sb
      .from("bookings")
      .select("support_category, quantity, unit_price, starts_at, status")
      .eq("participant_id", participant.id)
      .neq("status", "cancelled");
    if (fromIso) bookingsQ = bookingsQ.gte("starts_at", fromIso);
    if (toIso) bookingsQ = bookingsQ.lte("starts_at", toIso);
    const { data: bookings } = await bookingsQ;

    const spendByCategory: Record<string, number> = {};
    for (const b of bookings ?? []) {
      const code = (b as any).support_category;
      if (!code) continue;
      const amt = Number((b as any).quantity ?? 0) * Number((b as any).unit_price ?? 0);
      if (amt > 0) spendByCategory[code] = (spendByCategory[code] ?? 0) + amt;
    }

    // Per-goal aggregates
    const goalAgg = (goals ?? []).map((g: any) => {
      const items = (contribs ?? []).filter((c: any) => c.goal_id === g.id);
      const ratings = items
        .map((i: any) => Number(i.progress_rating ?? 0))
        .filter((n: number) => n > 0);
      const avg = ratings.length
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : null;
      // Derive hours from associated visits via actual or scheduled times.
      const linkedVisitIds = new Set(items.map((i: any) => i.visit_id));
      const hours = (visits ?? [])
        .filter((v: any) => linkedVisitIds.has(v.id))
        .reduce((sum: number, v: any) => {
          const s = new Date(v.actual_start ?? v.scheduled_start).getTime();
          const e = new Date(v.actual_end ?? v.scheduled_end).getTime();
          if (!isFinite(s) || !isFinite(e) || e <= s) return sum;
          return sum + (e - s) / 36e5;
        }, 0);
      return {
        ...g,
        visit_count: linkedVisitIds.size,
        hours: Math.round(hours * 100) / 100,
        avg_rating: avg,
        latest_notes: items
          .filter((i: any) => i.contribution_note)
          .sort((a: any, b: any) => (b.created_at > a.created_at ? 1 : -1))
          .slice(0, 5)
          .map((i: any) => ({ note: i.contribution_note, rating: i.progress_rating, at: i.created_at })),
      };
    });

    // Per-category aggregates
    const categoryAgg = (agreements ?? []).flatMap((a: any) =>
      (a.funding_agreement_categories ?? []).map((c: any) => ({
        agreement_title: a.title,
        support_category_code: c.support_category_code,
        budget: Number(c.total_amount ?? 0),
        spend_in_window: Number(spendByCategory[c.support_category_code] ?? 0),
      })),
    );

    return new Response(
      JSON.stringify({
        participant: {
          name: participant.name,
          ndis_number: participant.ndis_number,
          plan_start: participant.plan_start,
          plan_end: participant.plan_end,
        },
        window: { from, to },
        totals: {
          visits: (visits ?? []).length,
          goals: (goals ?? []).length,
        },
        goals: goalAgg,
        categories: categoryAgg,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});