import { DEMO_MODE } from "@/lib/demo-mode"

/**
 * WhatsApp integration seam. The real target here is the official
 * **WhatsApp Business Cloud API** (Meta) — never unofficial WhatsApp Web
 * scraping, which is against WhatsApp's terms and unsuitable for production.
 *
 * Two things are true at once in this module:
 * - `buildClickToChatLink` / `fillMessageTemplate` are REAL, working code —
 *   `wa.me` click-to-chat links need no API credentials or approval, so
 *   there is nothing to mock there.
 * - `simulateSendWhatsAppMessage` stands in for the Cloud API's
 *   `/messages` endpoint, which requires a Meta App, a verified business,
 *   and a permanent access token. None of that exists here, so it resolves
 *   locally instead of calling out.
 */

export interface WhatsAppIntegrationStatus {
  configured: boolean
  mode: "demo" | "live"
  provider: "whatsapp-business-cloud-api"
}

export function getWhatsAppIntegrationStatus(): WhatsAppIntegrationStatus {
  return {
    configured: !DEMO_MODE,
    mode: DEMO_MODE ? "demo" : "live",
    provider: "whatsapp-business-cloud-api",
  }
}

/** Real click-to-chat link — https://wa.me spec, no credentials required. */
export function buildClickToChatLink(number: string, message: string): string {
  const digits = number.replace(/[^\d]/g, "")
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`
}

export function fillMessageTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] ?? match)
}

export interface SendMessageResult {
  ok: boolean
  messageId: string
}

/** Simulated — a real integration calls POST /v19.0/{phone-number-id}/messages. */
export async function simulateSendWhatsAppMessage(_to: string, _body: string): Promise<SendMessageResult> {
  await new Promise((resolve) => setTimeout(resolve, 450))
  return { ok: true, messageId: `sim_wa_${Date.now()}` }
}

export interface ConnectAccountResult {
  ok: boolean
}

/** Simulated — a real integration runs Meta's embedded signup / OAuth flow. */
export async function simulateConnectWhatsAppAccount(_businessName: string): Promise<ConnectAccountResult> {
  await new Promise((resolve) => setTimeout(resolve, 900))
  return { ok: true }
}
