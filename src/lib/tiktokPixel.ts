/**
 * TikTok Pixel helper – client-side + server-side Events API
 */
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      identify: (params: Record<string, unknown>) => void;
      page: () => void;
    };
  }
}

function ttq() {
  return window.ttq;
}

/** Send event server-side via Edge Function (fire-and-forget) */
function sendServerEvent(payload: Record<string, unknown>) {
  supabase.functions.invoke("tiktok-event", { body: payload }).catch((err) => {
    console.warn("TikTok server event failed:", err);
  });
}

/** Fire after a user completes signup */
export function trackCompleteRegistration(email?: string) {
  const eventId = crypto.randomUUID();
  ttq()?.track("CompleteRegistration", {
    content_name: "quiz_signup",
    ...(email && { email }),
  });
  sendServerEvent({
    event: "CompleteRegistration",
    event_id: eventId,
    email,
    user_agent: navigator.userAgent,
  });
}

/** Fire when the user initiates the checkout process */
export function trackInitiateCheckout(planId: string, value: number, currency = "BRL") {
  const eventId = crypto.randomUUID();
  ttq()?.track("InitiateCheckout", {
    content_id: planId,
    content_type: "product",
    value,
    currency,
  });
  sendServerEvent({
    event: "InitiateCheckout",
    event_id: eventId,
    value,
    currency,
    content_id: planId,
    content_type: "product",
    user_agent: navigator.userAgent,
  });
}

/** Fire on successful purchase */
export function trackPurchase(value?: number, currency = "BRL") {
  const eventId = crypto.randomUUID();
  ttq()?.track("CompletePayment", {
    content_type: "product",
    ...(value !== undefined && { value, currency }),
  });
  sendServerEvent({
    event: "CompletePayment",
    event_id: eventId,
    ...(value !== undefined && { value, currency }),
    content_type: "product",
    user_agent: navigator.userAgent,
  });
}
