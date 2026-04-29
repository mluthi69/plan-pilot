// AI-assisted progress-note drafter. Uses Lovable AI Gateway.
// Pulls participant goals + recent notes + this visit's geo + goal contributions
// and asks the model for a concise NDIS-style progress note.

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
    const { visit_id, participant_id, service_type } = await req.json();
    if (!visit_id || !participant_id) {
      return new Response(JSON.stringify({ error: "visit_id and participant_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Pull recent notes for this participant (last 5)
    const [{ data: recentNotes }, { data: goals }, { data: contribs }, { data: visit }] =
      await Promise.all([
        supabase
          .from("notes")
          .select("note_type, title, body, created_at")
          .eq("participant_id", participant_id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("participant_goals")
          .select("title, description, ndis_outcome_domain")
          .eq("participant_id", participant_id)
          .eq("status", "active"),
        supabase
          .from("visit_goal_contributions")
          .select("contribution_note, progress_rating, goal:goal_id(title)")
          .eq("visit_id", visit_id),
        supabase
          .from("visits")
          .select("scheduled_start, scheduled_end, actual_start, actual_end")
          .eq("id", visit_id)
          .maybeSingle(),
      ]);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI is not enabled" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sys =
      "You are an experienced NDIS support worker. Draft a concise, factual progress note for a single visit. " +
      "Use plain Australian English. Keep it under ~180 words. Use these sections: " +
      "Activities completed; Participant response; Goal progress; Risks/observations; Next steps. " +
      "Never invent facts that are not present in the supplied context.";

    const userParts = [
      service_type ? `Service type: ${service_type}` : null,
      visit
        ? `Visit times — scheduled ${visit.scheduled_start} → ${visit.scheduled_end}, actual ${visit.actual_start ?? "?"} → ${visit.actual_end ?? "?"}`
        : null,
      goals?.length
        ? `Active goals:\n${goals.map((g: any) => `- ${g.title}${g.ndis_outcome_domain ? ` (${g.ndis_outcome_domain})` : ""}${g.description ? `: ${g.description}` : ""}`).join("\n")}`
        : null,
      contribs?.length
        ? `Goal contributions captured this visit:\n${contribs.map((c: any) => `- ${c.goal?.title ?? "Goal"}: rating=${c.progress_rating ?? "—"}, note=${c.contribution_note ?? "—"}`).join("\n")}`
        : "No goal contributions captured yet — infer from prior history.",
      recentNotes?.length
        ? `Recent notes (most recent first):\n${recentNotes.map((n: any) => `[${n.note_type}] ${n.title ?? ""}\n${n.body}`).join("\n---\n")}`
        : null,
    ].filter(Boolean).join("\n\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userParts },
        ],
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded — try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI error: ${t}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiRes.json();
    const note: string = json?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ note }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});