import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIKTOK_API_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
const PIXEL_CODE = "D6QOFFJC77UDHQHKKO80";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const accessToken = Deno.env.get("TIKTOK_EVENTS_API_TOKEN");
  if (!accessToken) {
    return new Response(
      JSON.stringify({ error: "TIKTOK_EVENTS_API_TOKEN not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const {
      event,
      event_id,
      email,
      phone,
      value,
      currency = "BRL",
      content_id,
      content_type = "product",
      user_agent,
      ip,
    } = body;

    if (!event) {
      return new Response(
        JSON.stringify({ error: "Missing required field: event" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash email/phone with SHA-256 for privacy (TikTok requirement)
    async function sha256(text: string): Promise<string> {
      const encoder = new TextEncoder();
      const data = encoder.encode(text.trim().toLowerCase());
      const hash = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    const user: Record<string, string> = {};
    if (email) user.email = await sha256(email);
    if (phone) user.phone = await sha256(phone);
    if (ip) user.ip = ip;
    if (user_agent) user.user_agent = user_agent;

    const properties: Record<string, unknown> = {};
    if (value !== undefined) properties.value = value;
    if (currency) properties.currency = currency;
    if (content_id) properties.content_id = content_id;
    if (content_type) properties.content_type = content_type;

    const eventData: Record<string, unknown> = {
      event,
      event_time: Math.floor(Date.now() / 1000),
      user,
      properties,
    };
    if (event_id) eventData.event_id = event_id;

    const payload = {
      pixel_code: PIXEL_CODE,
      data: [eventData],
    };

    const response = await fetch(TIKTOK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || result.code !== 0) {
      console.error("TikTok Events API error:", JSON.stringify(result));
      return new Response(
        JSON.stringify({ success: false, tiktok_response: result }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: result.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("TikTok event error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
