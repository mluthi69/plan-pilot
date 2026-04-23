import { corsHeaders } from "@supabase/supabase-js/cors";

/**
 * Returns the public Google Maps JS SDK key for the browser.
 * Restrict by HTTP referrer in Google Cloud Console.
 */
Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const key = Deno.env.get("GOOGLE_MAPS_BROWSER_KEY") ?? Deno.env.get("GOOGLE_MAPS_SERVER_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "Maps key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ key }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});