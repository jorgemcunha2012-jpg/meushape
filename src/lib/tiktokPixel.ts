/**
 * TikTok Pixel helper – thin wrapper around window.ttq
 * Docs: https://business-api.tiktok.com/portal/docs?id=1739585700402178
 */

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

/** Fire after a user completes signup */
export function trackCompleteRegistration(email?: string) {
  ttq()?.track("CompleteRegistration", {
    content_name: "quiz_signup",
    ...(email && { email }),
  });
}

/** Fire when the user initiates the checkout process */
export function trackInitiateCheckout(planId: string, value: number, currency = "BRL") {
  ttq()?.track("InitiateCheckout", {
    content_id: planId,
    content_type: "product",
    value,
    currency,
  });
}

/** Fire on successful purchase */
export function trackPurchase(value?: number, currency = "BRL") {
  ttq()?.track("CompletePayment", {
    content_type: "product",
    ...(value !== undefined && { value, currency }),
  });
}
