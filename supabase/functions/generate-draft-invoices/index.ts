// Batch-generate draft invoices from completed visits.
// One invoice per (org, participant), grouping all completed visits whose
// linked booking has not yet been invoiced. Each visit becomes a line item
// with its own evidence_pack_token (magic link) for the participant/funder.

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
    const { org_id, participant_id } = await req.json().catch(() => ({}));
    if (!org_id) {
      return new Response(JSON.stringify({ error: "org_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Pull completed visits + their bookings (with quantity/price/category)
    let q = sb
      .from("visits")
      .select(
        "id, participant_id, booking_id, scheduled_start, participant_signed, notes_submitted, bookings!inner(id, support_category, support_item_code, quantity, unit, unit_price, service_type)",
      )
      .eq("org_id", org_id)
      .eq("status", "completed");
    if (participant_id) q = q.eq("participant_id", participant_id);

    const { data: visits, error: vErr } = await q;
    if (vErr) throw vErr;

    // Org settings for completion gates (used to flag risky lines, NOT to block).
    const { data: settings } = await sb
      .from("org_settings")
      .select("require_geo_checkin, require_goal_contribution")
      .eq("org_id", org_id)
      .maybeSingle();
    const requireGeo = !!settings?.require_geo_checkin;
    const requireGoal = !!settings?.require_goal_contribution;

    // Skip visits already linked to an invoice line
    const visitIds = (visits ?? []).map((v: any) => v.id);
    let alreadyLinked = new Set<string>();
    if (visitIds.length) {
      const { data: lines } = await sb
        .from("invoice_lines")
        .select("visit_id")
        .in("visit_id", visitIds);
      alreadyLinked = new Set((lines ?? []).map((l: any) => l.visit_id).filter(Boolean));
    }

    // Pre-fetch geo + contributions in bulk for validation
    let geoByVisit: Record<string, any[]> = {};
    let contribByVisit: Record<string, any[]> = {};
    if (visitIds.length) {
      const [{ data: gf }, { data: gc }] = await Promise.all([
        sb.from("visit_geo_fixes").select("visit_id, kind").in("visit_id", visitIds),
        sb.from("visit_goal_contributions").select("visit_id, progress_rating").in("visit_id", visitIds),
      ]);
      for (const r of gf ?? []) (geoByVisit[r.visit_id] ??= []).push(r);
      for (const r of gc ?? []) (contribByVisit[r.visit_id] ??= []).push(r);
    }

    const skippedReport: Array<{ visit_id: string; reasons: string[] }> = [];
    const eligible: any[] = [];
    for (const v of visits ?? []) {
      const reasons: string[] = [];
      if (alreadyLinked.has(v.id)) reasons.push("Already invoiced");
      const b = v.bookings;
      if (!b?.quantity) reasons.push("Missing quantity on booking");
      if (!b?.unit_price) reasons.push("Missing unit price on booking");
      if (requireGeo) {
        const fixes = geoByVisit[v.id] ?? [];
        if (!fixes.some((f) => f.kind === "check_in")) reasons.push("Missing geo check-in");
        if (!fixes.some((f) => f.kind === "check_out")) reasons.push("Missing geo check-out");
      }
      if (requireGoal) {
        const c = contribByVisit[v.id] ?? [];
        if (!c.some((x) => x.progress_rating != null && x.progress_rating > 0))
          reasons.push("Missing goal contribution rating");
      }
      if (reasons.length === 0) eligible.push(v);
      else skippedReport.push({ visit_id: v.id, reasons });
    }

    // Group by participant
    const byParticipant: Record<string, any[]> = {};
    for (const v of eligible) (byParticipant[v.participant_id] ??= []).push(v);

    const created: any[] = [];
    for (const [pid, vs] of Object.entries(byParticipant)) {
      const total = vs.reduce(
        (s, v) => s + Number(v.bookings.quantity) * Number(v.bookings.unit_price),
        0,
      );
      const invoiceNumber = `DRAFT-${Date.now()}-${pid.slice(0, 6)}`;
      const { data: inv, error: invErr } = await sb
        .from("invoices")
        .insert({
          org_id,
          invoice_number: invoiceNumber,
          participant_id: pid,
          category: "Core",
          line_count: vs.length,
          amount: total,
          status: "pending",
          notes: `Auto-generated from ${vs.length} completed visit(s).`,
        })
        .select()
        .single();
      if (invErr) throw invErr;

      const lineRows = vs.map((v) => {
        const b = v.bookings;
        const qty = Number(b.quantity);
        const price = Number(b.unit_price);
        return {
          org_id,
          invoice_id: inv.id,
          visit_id: v.id,
          support_item_code: b.support_item_code ?? null,
          support_category_code: b.support_category ?? null,
          description: b.service_type ?? "Support",
          unit: b.unit ?? "hours",
          quantity: qty,
          unit_price: price,
          amount: qty * price,
        };
      });
      const { error: linesErr } = await sb.from("invoice_lines").insert(lineRows);
      if (linesErr) throw linesErr;
      created.push({ invoice_id: inv.id, lines: lineRows.length, total });
    }

    return new Response(JSON.stringify({
      created,
      skipped_count: skippedReport.length,
      skipped: skippedReport,
      considered: (visits ?? []).length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});