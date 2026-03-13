import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE = "https://api.musclewiki.com";

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
    const endpoint = url.searchParams.get("endpoint");

    // ─── Mode 1: Proxy API endpoints (search, exercises, muscles, etc.) ───
    if (endpoint) {
      // Validate endpoint to prevent abuse
      const allowedEndpoints = ["search", "exercises", "muscles", "categories", "filters"];
      const endpointBase = endpoint.split("/")[0].split("?")[0];
      if (!allowedEndpoints.includes(endpointBase)) {
        return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Forward all query params except "endpoint"
      const targetUrl = new URL(`${BASE}/${endpoint}`);
      for (const [key, value] of url.searchParams.entries()) {
        if (key !== "endpoint") {
          targetUrl.searchParams.set(key, value);
        }
      }

      const response = await fetch(targetUrl.toString(), {
        headers: { "X-API-Key": apiKey },
      });

      // If API returns 403 (tier restriction), return empty results gracefully
      if (response.status === 403) {
        const emptyResult = endpointBase === "search" ? "[]" 
          : endpointBase === "exercises" ? JSON.stringify({ total: 0, limit: 20, offset: 0, count: 0, results: [] })
          : "[]";
        return new Response(emptyResult, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
        });
      }

      const body = await response.text();
      return new Response(body, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": response.headers.get("Content-Type") || "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // ─── Mode 2: Proxy media streams (video/image) ───
    if (mediaUrl) {
      if (!mediaUrl.startsWith("https://api.musclewiki.com/stream/")) {
        return new Response(JSON.stringify({ error: "Invalid media URL" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
    }

    return new Response(JSON.stringify({ error: "Provide 'endpoint' or 'url' param" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
