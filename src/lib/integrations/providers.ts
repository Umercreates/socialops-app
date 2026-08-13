/**
 * Central provider registry for the APIs & Integrations Control Center.
 * Every provider the UI/API knows about is defined exactly once here —
 * nothing downstream should hardcode a provider id/name/field list.
 *
 * Adding a future provider (Instagram, Google, TikTok, ...) should mostly
 * mean adding an entry here plus a small adapter, not touching the UI or
 * the credential-storage plumbing.
 */

export type ProviderId =
  | "gemini"
  | "whatsapp"
  | "meta"
  | "tiktok"
  | "linkedin"
  | "x"
  | "youtube"
  | "omnidimension"
  | "google-sheets"
  | "google-calendar"

export type ProviderCategory = "ai" | "messaging" | "social" | "calling" | "google"

export type IntegrationMode = "disabled" | "demo" | "live"

/** `not_configured`/`configured` describe credential presence; the rest
 * describe the last known connection outcome. Never inferred as "connected"
 * from mode alone — only a successful test (or live send/receive) sets it. */
export type IntegrationStatus = "not_configured" | "configured" | "connected" | "error" | "expired" | "disabled"

export interface CredentialField {
  key: string
  label: string
  helpText?: string
  /** Secret fields are encrypted at rest and never echoed back to the client. */
  secret: boolean
  required: boolean
  placeholder?: string
}

export interface ProviderDefinition {
  id: ProviderId
  name: string
  category: ProviderCategory
  description: string
  /** Short, human list of what this integration actually does once connected. */
  capabilities: string[]
  credentialFields: CredentialField[]
  supportedModes: IntegrationMode[]
  requiresOAuth: boolean
  requiresWebhook: boolean
  webhookPath?: string
  /** Whether a server environment variable can supply this provider's
   * credentials as a fallback when no workspace-level record exists. */
  envFallback?: { envVar: string; describes: string }
}

export const PROVIDER_REGISTRY: Record<ProviderId, ProviderDefinition> = {
  gemini: {
    id: "gemini",
    name: "Gemini",
    category: "ai",
    description: "Powers AI Assistant captions/replies and the WhatsApp sales-qualification chatbot.",
    capabilities: ["Content generation", "WhatsApp lead qualification"],
    credentialFields: [{ key: "apiKey", label: "API key", secret: true, required: true }],
    supportedModes: ["demo", "live"],
    requiresOAuth: false,
    requiresWebhook: false,
    envFallback: { envVar: "GEMINI_API_KEY", describes: "server-configured Gemini API key" },
  },
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp Cloud API",
    category: "messaging",
    description: "Official Meta WhatsApp Business Cloud API for real customer conversations.",
    capabilities: ["Send/receive messages", "AI sales qualification", "CRM lead sync"],
    credentialFields: [
      { key: "wabaId", label: "WhatsApp Business Account ID", secret: false, required: true },
      { key: "phoneNumberId", label: "Phone Number ID", secret: false, required: true },
      { key: "accessToken", label: "Access token", secret: true, required: true },
      { key: "verifyToken", label: "Webhook verify token", secret: true, required: true },
      { key: "appSecret", label: "Meta App secret", helpText: "Used to verify inbound webhook signatures.", secret: true, required: true },
    ],
    supportedModes: ["demo", "live"],
    requiresOAuth: false,
    requiresWebhook: true,
    webhookPath: "/api/webhooks/whatsapp",
  },
  meta: {
    id: "meta",
    name: "Meta / Facebook / Instagram",
    category: "social",
    description: "Facebook Page and Instagram publishing/inbox — not yet implemented.",
    capabilities: ["Publishing (future)", "Unified inbox (future)"],
    credentialFields: [
      { key: "appId", label: "Meta App ID", secret: false, required: true },
      { key: "appSecret", label: "Meta App secret", secret: true, required: true },
    ],
    supportedModes: ["demo"],
    requiresOAuth: true,
    requiresWebhook: false,
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    category: "social",
    description: "TikTok publishing — not yet implemented.",
    capabilities: ["Publishing (future)"],
    credentialFields: [
      { key: "clientKey", label: "Client key", secret: false, required: true },
      { key: "clientSecret", label: "Client secret", secret: true, required: true },
    ],
    supportedModes: ["demo"],
    requiresOAuth: true,
    requiresWebhook: false,
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    category: "social",
    description: "LinkedIn publishing — not yet implemented.",
    capabilities: ["Publishing (future)"],
    credentialFields: [
      { key: "clientId", label: "Client ID", secret: false, required: true },
      { key: "clientSecret", label: "Client secret", secret: true, required: true },
    ],
    supportedModes: ["demo"],
    requiresOAuth: true,
    requiresWebhook: false,
  },
  x: {
    id: "x",
    name: "X (Twitter)",
    category: "social",
    description: "X publishing — not yet implemented.",
    capabilities: ["Publishing (future)"],
    credentialFields: [
      { key: "apiKey", label: "API key", secret: true, required: true },
      { key: "apiSecret", label: "API secret", secret: true, required: true },
    ],
    supportedModes: ["demo"],
    requiresOAuth: true,
    requiresWebhook: false,
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    category: "social",
    description: "YouTube publishing — not yet implemented.",
    capabilities: ["Publishing (future)"],
    credentialFields: [{ key: "apiKey", label: "API key", secret: true, required: true }],
    supportedModes: ["demo"],
    requiresOAuth: true,
    requiresWebhook: false,
  },
  omnidimension: {
    id: "omnidimension",
    name: "OmniDimension",
    category: "calling",
    description: "AI calling agent. Agent is configured; no production phone number yet — calling stays in demo mode until Phase 4.",
    capabilities: ["Outbound AI calls (Phase 4)"],
    credentialFields: [
      { key: "apiKey", label: "API key", secret: true, required: true },
      { key: "agentId", label: "Agent ID", secret: false, required: true },
      { key: "fromNumberId", label: "From-number ID", secret: false, required: false },
    ],
    supportedModes: ["demo"],
    requiresOAuth: false,
    requiresWebhook: false,
    envFallback: { envVar: "OMNIDIM_API_KEY", describes: "server-configured OmniDimension API key" },
  },
  "google-sheets": {
    id: "google-sheets",
    name: "Google Sheets",
    category: "google",
    description: "Lead export/sync to Google Sheets — not yet implemented.",
    capabilities: ["Lead export (future)"],
    credentialFields: [
      { key: "clientId", label: "OAuth client ID", secret: false, required: true },
      { key: "clientSecret", label: "OAuth client secret", secret: true, required: true },
    ],
    supportedModes: ["demo"],
    requiresOAuth: true,
    requiresWebhook: false,
  },
  "google-calendar": {
    id: "google-calendar",
    name: "Google Calendar",
    category: "google",
    description: "Meeting scheduling sync — not yet implemented.",
    capabilities: ["Meeting sync (future)"],
    credentialFields: [
      { key: "clientId", label: "OAuth client ID", secret: false, required: true },
      { key: "clientSecret", label: "OAuth client secret", secret: true, required: true },
    ],
    supportedModes: ["demo"],
    requiresOAuth: true,
    requiresWebhook: false,
  },
}

export const PROVIDER_IDS = Object.keys(PROVIDER_REGISTRY) as ProviderId[]

export function isProviderId(value: string): value is ProviderId {
  return value in PROVIDER_REGISTRY
}

export const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  ai: "AI",
  messaging: "Messaging",
  social: "Social",
  calling: "Calling",
  google: "Google",
}
