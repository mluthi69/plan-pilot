import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_KEY = Deno.env.get("GOOGLE_MAPS_SERVER_KEY")!;

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
  try {
    const { address } = await req.json();
    if (!address || typeof address !== "string" || address.length < 3 || address.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid address" }), {
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

    const normalized = address.trim().toLowerCase();
    const hash = await sha256(normalized);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 90-day cache lookup
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from("geocode_cache")
      .select("formatted_address, lat, lng, place_id, created_at")
      .eq("address_hash", hash)
      .gte("created_at", ninetyDaysAgo)
      .maybeSingle();
    if (cached) {
      return new Response(
        JSON.stringify({ ...cached, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Call Google Geocoding API (bias to AU)
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("region", "au");
    url.searchParams.set("components", "country:AU");
    url.searchParams.set("key", GOOGLE_KEY);

    const r = await fetch(url);
    const j = await r.json();
    if (j.status !== "OK" || !j.results?.length) {
      return new Response(
        JSON.stringify({ error: "Address not found", google_status: j.status }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const top = j.results[0];
    const lat = top.geometry.location.lat;
    const lng = top.geometry.location.lng;
    const formatted = top.formatted_address as string;
    const placeId = top.place_id as string;

    await supabase.from("geocode_cache").insert({
      address_hash: hash,
      raw_address: address,
      formatted_address: formatted,
      lat,
      lng,
      place_id: placeId,
      components: top.address_components,
    });

    return new Response(
      JSON.stringify({ formatted_address: formatted, lat, lng, place_id: placeId, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});