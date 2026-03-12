import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("MUSCLEWIKI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "MUSCLEWIKI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const mediaUrl = url.searchParams.get("url");

    if (!mediaUrl || !mediaUrl.startsWith("https://api.musclewiki.com/stream/")) {
      return new Response(JSON.stringify({ error: "Invalid media URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward range headers for video streaming
    const rangeHeader = req.headers.get("Range");
    const fetchHeaders: Record<string, string> = { "X-API-Key": apiKey };
    if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

    const response = await fetch(mediaUrl, { headers: fetchHeaders });

    if (!response.ok && response.status !== 206) {
      const body = await response.text();
      return new Response(JSON.stringify({ error: `Upstream error ${response.status}`, body }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = response.headers.get("Content-Type") || "application/octet-stream";
    const contentLength = response.headers.get("Content-Length");
    const contentRange = response.headers.get("Content-Range");
    const acceptRanges = response.headers.get("Accept-Ranges");

    const respHeaders: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    };

    if (contentLength) respHeaders["Content-Length"] = contentLength;
    if (contentRange) respHeaders["Content-Range"] = contentRange;
    if (acceptRanges) respHeaders["Accept-Ranges"] = acceptRanges;

    return new Response(response.body, {
      status: response.status,
      headers: respHeaders,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
