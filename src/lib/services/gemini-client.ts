/**
 * Server-only Gemini caller — this module must only ever be imported by a
 * Route Handler, never by a "use client" component, or a key would end up
 * in the browser bundle. Takes the API key as an explicit parameter rather
 * than reading `process.env` itself: callers resolve the right key first
 * (workspace-saved key if that workspace has activated Gemini, else the
 * platform fallback) via `resolveActiveApiKey`, so this function never
 * silently uses the wrong workspace's — or nobody's — credential.
 *
 * Never throws: every failure mode (missing key, network error, non-2xx
 * response, empty completion) resolves to `{ ok: false }` so callers can
 * fall back to the local template generator without a try/catch of their own.
 */

const MODEL = "gemini-3.6-flash"
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

/**
 * A safe, sanitized classification of *why* a Gemini call failed - never
 * derived from or containing the raw provider payload, key, or request
 * content. Lets a caller (currently /api/ai/chat) log something useful
 * server-side ("Gemini AI request failed: quota_exhausted (HTTP 429)")
 * and show a genuinely different, still-generic message to the end user,
 * instead of collapsing every failure into one identical string.
 */
export type GeminiFailureCode =
  | "not_configured" // no API key resolved at all
  | "invalid_key" // key present but rejected/unauthorized
  | "quota_exhausted" // a previously-working key/project has run out of quota or prepaid credits
  | "rate_limited" // ordinary short-term throttling, not a billing state
  | "billing_required" // billing was never enabled for this project
  | "model_error" // the model id itself was rejected (not found/unsupported)
  | "network_error" // request never got a response (timeout, DNS, fetch threw)
  | "provider_error" // anything else - safe catch-all

export type GeminiResult = { ok: true; text: string } | { ok: false; code: GeminiFailureCode; reason: string }

export interface GeminiChatTurn {
  role: "user" | "model"
  text: string
}

/** Classifies a non-2xx Gemini response using only its HTTP status and
 * Google's own `error.status`/`error.message` - never the request body,
 * the key, or user content. */
function classifyHttpFailure(status: number, errorStatus: string | undefined, message: string): GeminiFailureCode {
  const lower = message.toLowerCase()
  if (status === 400 && (lower.includes("api key not valid") || lower.includes("api_key_invalid"))) return "invalid_key"
  if (status === 403) return "invalid_key"
  if (status === 404 || lower.includes("is not found") || lower.includes("not supported for")) return "model_error"
  if (status === 429) {
    // Deliberately does NOT match on the bare word "exhausted" - Google's
    // generic short-term rate-limit message is itself "Resource has been
    // exhausted (e.g. check quota).", which would otherwise be
    // misclassified as a billing/credits issue instead of an ordinary
    // rate limit. Only the more specific billing-language markers count.
    if (lower.includes("prepayment") || lower.includes("credits") || lower.includes("depleted")) return "quota_exhausted"
    if (lower.includes("billing")) return "billing_required"
    return "rate_limited"
  }
  if (errorStatus === "RESOURCE_EXHAUSTED") return "quota_exhausted"
  if (status >= 500) return "provider_error"
  return "provider_error"
}

async function callGemini(contents: { role: "user" | "model"; parts: { text: string }[] }[], systemInstruction: string | undefined, apiKey: string | null): Promise<GeminiResult> {
  if (!apiKey) return { ok: false, code: "not_configured", reason: "Gemini is not configured for this workspace." }

  try {
    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        contents,
        ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      const message = body?.error?.message ?? `Gemini request failed (${res.status})`
      const code = classifyHttpFailure(res.status, body?.error?.status, message)
      // Sanitized: code + HTTP status only - never Google's raw message,
      // the key, the request payload, or any user conversation content.
      console.error(`Gemini AI request failed: ${code} (HTTP ${res.status})`)
      return { ok: false, code, reason: message }
    }

    const body = await res.json()
    const text = body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? ""
    if (!text.trim()) {
      console.error("Gemini AI request failed: provider_error (empty completion)")
      return { ok: false, code: "provider_error", reason: "Gemini returned an empty completion" }
    }

    return { ok: true, text: text.trim() }
  } catch (error) {
    console.error("Gemini AI request failed: network_error")
    return { ok: false, code: "network_error", reason: error instanceof Error ? error.message : "Unknown Gemini request error" }
  }
}

export async function generateWithGemini(prompt: string, systemInstruction: string | undefined, apiKey: string | null): Promise<GeminiResult> {
  return callGemini([{ role: "user", parts: [{ text: prompt }] }], systemInstruction, apiKey)
}

/** Multi-turn variant for a genuine chat experience - `turns` is the
 * caller's already-bounded conversation history (oldest first, ending
 * with the newest user message), mapped directly to Gemini's `contents`
 * shape. Same never-throws contract as generateWithGemini. */
export async function generateChatWithGemini(turns: GeminiChatTurn[], systemInstruction: string | undefined, apiKey: string | null): Promise<GeminiResult> {
  return callGemini(
    turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    systemInstruction,
    apiKey
  )
}
