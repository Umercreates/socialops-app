import { generateWithGemini } from "@/lib/services/gemini-client"
import type { ProviderId } from "./providers"
import { resolveCredentialValue, type TestConnectionResult } from "./service"
import { getConnection } from "./repository"
import { testWhatsAppCredentials } from "./whatsapp/cloud-api"

/**
 * Provider test-connection dispatcher — the server-side implementation of
 * "Test Connection." Never called from the browser directly against a
 * provider's own API; the browser only ever calls our own
 * POST /api/integrations/[provider]/test, which calls in here.
 *
 * Only providers with a real, verifiable API call get a real test. Every
 * other provider returns an honest "not available yet" result rather than
 * fabricating a connected state — matching Phase 3's explicit requirement
 * to never mark a service connected without evidence.
 */
export async function testProviderConnection(workspaceId: string, provider: ProviderId): Promise<TestConnectionResult> {
  const row = await getConnection(workspaceId, provider)

  switch (provider) {
    case "gemini": {
      const { value: apiKey } = resolveCredentialValue(row, "apiKey", provider)
      if (!apiKey) return { ok: false, status: "not_configured", message: "No API key configured." }

      const previous = process.env.GEMINI_API_KEY
      process.env.GEMINI_API_KEY = apiKey
      try {
        const result = await generateWithGemini("Reply with exactly the word OK.", "You are a connection test. Reply with exactly OK.")
        if (result.ok) return { ok: true, status: "connected", message: "Gemini responded successfully." }
        return { ok: false, status: "error", message: result.reason }
      } finally {
        if (previous === undefined) delete process.env.GEMINI_API_KEY
        else process.env.GEMINI_API_KEY = previous
      }
    }

    case "whatsapp": {
      const phoneNumberId = row?.config?.phoneNumberId as string | undefined
      const { value: accessToken } = resolveCredentialValue(row, "accessToken", provider)
      if (!phoneNumberId || !accessToken) {
        return { ok: false, status: "not_configured", message: "Phone Number ID and access token are both required." }
      }
      return testWhatsAppCredentials(phoneNumberId, accessToken)
    }

    default:
      return {
        ok: false,
        status: row?.status === "disabled" ? "disabled" : "not_configured",
        message: "Connection testing isn't implemented for this provider yet.",
      }
  }
}
