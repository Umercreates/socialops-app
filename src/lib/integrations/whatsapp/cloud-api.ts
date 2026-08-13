import type { TestConnectionResult } from "../service"

/**
 * Official Meta WhatsApp Business Cloud API client. No WhatsApp Web
 * automation, no browser scraping, no unofficial library — this is the only
 * transport for real WhatsApp send/receive in this app.
 *
 * Graph API version pinned to one constant so bumping it later is a
 * one-line change rather than a search-and-replace.
 */
const GRAPH_API_VERSION = "v21.0"
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export interface SendTextMessageResult {
  ok: boolean
  externalMessageId?: string
  errorMessage?: string
}

/** POST /{phone-number-id}/messages — sends a plain text message. */
export async function sendWhatsAppTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  body: string
): Promise<SendTextMessageResult> {
  try {
    const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    })

    const json = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false, errorMessage: json?.error?.message ?? `WhatsApp send failed (${res.status})` }
    }

    const externalMessageId = json?.messages?.[0]?.id as string | undefined
    return { ok: true, externalMessageId }
  } catch (error) {
    return { ok: false, errorMessage: error instanceof Error ? error.message : "Unknown WhatsApp send error" }
  }
}

/** Lightweight, read-only GET used for "Test Connection" — never sends a
 * message, never incurs cost, just confirms the phone number ID + access
 * token are valid and the token has permission to read this number. */
export async function testWhatsAppCredentials(phoneNumberId: string, accessToken: string): Promise<TestConnectionResult> {
  try {
    const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}?fields=verified_name,display_phone_number`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    })

    const json = await res.json().catch(() => null)
    if (!res.ok) {
      const code = json?.error?.code
      if (code === 190) return { ok: false, status: "expired", message: "Access token is invalid or expired." }
      return { ok: false, status: "error", message: json?.error?.message ?? `WhatsApp API returned ${res.status}` }
    }

    const name = json?.verified_name ?? json?.display_phone_number ?? "WhatsApp number"
    return { ok: true, status: "connected", message: `Connected to ${name}.` }
  } catch (error) {
    return { ok: false, status: "error", message: error instanceof Error ? error.message : "Couldn't reach the WhatsApp API." }
  }
}
