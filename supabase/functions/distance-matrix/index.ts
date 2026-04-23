import { corsHeaders } from "@supabase/supabase-js/cors";

const GOOGLE_KEY = Deno.env.get("GOOGLE_MAPS_SERVER_KEY")!;

interface Coord { lat: number; lng: number }

/**
 * Body: { origins: Coord[], destinations: Coord[], mode?: "driving"|"walking" }
 * Returns: { rows: Array<Array<{ km: number; minutes: number; status: string }>> }
 * Cells correspond to origins[i] × destinations[j].
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
  try {
    const { origins, destinations, mode = "driving" } = await req.json();
    if (!Array.isArray(origins) || !Array.isArray(destinations) ||
        origins.length === 0 || destinations.length === 0 ||
        origins.length > 25 || destinations.length > 25) {
      return new Response(JSON.stringify({ error: "Invalid origins/destinations (1-25 each)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!GOOGLE_KEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_MAPS_SERVER_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fmt = (arr: Coord[]) => arr.map((c) => `${c.lat},${c.lng}`).join("|");
    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", fmt(origins));
    url.searchParams.set("destinations", fmt(destinations));
    url.searchParams.set("mode", mode);
    url.searchParams.set("units", "metric");
    url.searchParams.set("region", "au");
    url.searchParams.set("key", GOOGLE_KEY);

    const r = await fetch(url);
    const j = await r.json();
    if (j.status !== "OK") {
      return new Response(JSON.stringify({ error: "Distance matrix failed", google_status: j.status }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rows = (j.rows ?? []).map((row: any) =>
      (row.elements ?? []).map((el: any) => ({
        status: el.status,
        km: el.status === "OK" ? Math.round((el.distance.value / 1000) * 100) / 100 : 0,
        minutes: el.status === "OK" ? Math.round(el.duration.value / 60) : 0,
      })),
    );
    return new Response(JSON.stringify({ rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});