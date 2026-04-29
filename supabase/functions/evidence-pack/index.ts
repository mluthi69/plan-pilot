// Public evidence-pack endpoint. Looks up an invoice line by its
// `evidence_pack_token` and returns a summary of the visit:
// participant (name only), visit times, geo fixes, goal contributions,
// notes, and signed URLs for any photo attachments.

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

    const { data: line, error } = await sb
      .from("invoice_lines")
      .select(
        "id, invoice_id, visit_id, support_item_code, support_category_code, description, quantity, unit, unit_price, amount, invoice:invoice_id(invoice_number, received_at)",
      )
      .eq("evidence_pack_token", token)
      .maybeSingle();
    if (error) throw error;
    if (!line || !line.visit_id) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: visit }, { data: fixes }, { data: contribs }, { data: notes }, { data: attachments }] =
      await Promise.all([
        sb.from("visits")
          .select("scheduled_start, scheduled_end, actual_start, actual_end, participant_signed, participant_signature_name, participants(name)")
          .eq("id", line.visit_id)
          .maybeSingle(),
        sb.from("visit_geo_fixes").select("kind, lat, lng, accuracy_m, captured_at").eq("visit_id", line.visit_id),
        sb.from("visit_goal_contributions")
          .select("progress_rating, contribution_note, goal:goal_id(title, ndis_outcome_domain)")
          .eq("visit_id", line.visit_id),
        sb.from("notes").select("title, body, note_type, created_at").eq("visit_id", line.visit_id),
        sb.from("attachments").select("storage_path, filename, mime_type").eq("visit_id", line.visit_id),
      ]);

    // Sign image URLs only
    const signed = await Promise.all(
      (attachments ?? []).map(async (a: any) => {
        const { data } = await sb.storage.from("visit-attachments").createSignedUrl(a.storage_path, 60 * 60);
        return { ...a, signed_url: data?.signedUrl ?? null };
      }),
    );

    return new Response(
      JSON.stringify({
        line,
        visit: visit ? { ...visit, participant_name: (visit as any).participants?.name ?? null } : null,
        geo_fixes: fixes ?? [],
        goal_contributions: contribs ?? [],
        notes: notes ?? [],
        attachments: signed,
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