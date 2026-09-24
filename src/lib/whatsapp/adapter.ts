import "server-only";

/**
 * Thin adapter over whichever WhatsApp gateway we end up on (Fonnte/Wablas-
 * style unofficial gateway for the MVP, Meta Cloud API later). The request
 * shape below follows the common "target + message + Authorization token"
 * pattern most Indonesian gateways use — but it is NOT verified against a
 * real account. Confirm the exact field names against your provider's own
 * docs/dashboard once you've signed up, and adjust this one function; every
 * caller (the webhook's confirmation reply) goes through it, untouched.
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;
  if (!apiUrl || !apiKey) {
    console.warn("sendWhatsAppMessage: WHATSAPP_API_URL/WHATSAPP_API_KEY not configured, skipping send.");
    return false;
  }

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ target: to, message: text }),
    });
    return res.ok;
  } catch (err) {
    console.error("sendWhatsAppMessage: send failed:", err);
    return false;
  }
}
