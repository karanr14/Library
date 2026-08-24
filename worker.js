/**
 * Library proxy — keeps the jsonbin.io master key server-side.
 * The frontend only ever talks to this Worker; this Worker is the
 * only thing that knows BIN_ID and MASTER_KEY.
 *
 * Routes (mirrors the shape the frontend already expects):
 *   GET  /b/latest  -> reads the bin, returns jsonbin's { record: [...] } shape
 *   PUT  /b         -> overwrites the bin with the posted JSON array
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const origin = request.headers.get("Origin");
    const allowedOrigin = env.ALLOWED_ORIGIN;

    const corsHeaders = {
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Only allow requests from the configured origin
    if (origin === allowedOrigin) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    } else {
      corsHeaders["Access-Control-Allow-Origin"] = "null";
    }

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (!env.BIN_ID || !env.MASTER_KEY) {
      return new Response(
        JSON.stringify({ error: "Worker is missing BIN_ID or MASTER_KEY secrets." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    try {
      if (url.pathname === "/b/latest" && request.method === "GET") {
        const upstream = await fetch(`https://api.jsonbin.io/v3/b/${env.BIN_ID}/latest`, {
          headers: { "X-Master-Key": env.MASTER_KEY },
        });
        const body = await upstream.text();
        return new Response(body, {
          status: upstream.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (url.pathname === "/b" && request.method === "PUT") {
        const upstream = await fetch(`https://api.jsonbin.io/v3/b/${env.BIN_ID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Master-Key": env.MASTER_KEY,
          },
          body: await request.text(),
        });
        const body = await upstream.text();
        return new Response(body, {
          status: upstream.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Upstream request failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  },
};
