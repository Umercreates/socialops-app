import type { WhatsAppAccount } from "@/types"

/** EasyLife runs a single WhatsApp Business number — no multi-number/department
 * routing. The number stays configurable (Settings → WhatsApp) but every
 * social lead and QR/link always resolves to this one account. */
export const WHATSAPP_ACCOUNT: WhatsAppAccount = {
  id: "wa_account_1",
  businessName: "EasyLife Business",
  number: "+92 300 0000000",
  status: "connected",
  connectedAt: "2026-06-15T09:00:00Z",
  lastSyncAt: "2026-08-09T15:50:00Z",
}

export const DEFAULT_CTA_MESSAGE = "Hi, I came from {{platform}} and I'm interested in {{service}}."
