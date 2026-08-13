/**
 * Server-only Gemini caller. `GEMINI_API_KEY` is read from `process.env`
 * here and nowhere else reachable from the client — this module must only
 * ever be imported by a Route Handler, never by a "use client" component,
 * or the key would end up in the browser bundle.
 *
 * Never throws: every failure mode (missing key, network error, non-2xx
 * response, empty completion) resolves to `{ ok: false }` so callers can
 * fall back to the local template generator without a try/catch of their own.
 */

const MODEL = "gemini-3.6-flash"
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

export type GeminiResult = { ok: true; text: string } | { ok: false; reason: string }

export async function generateWithGemini(prompt: string, systemInstruction?: string): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { ok: false, reason: "GEMINI_API_KEY not configured" }

  try {
    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      return { ok: false, reason: body?.error?.message ?? `Gemini request failed (${res.status})` }
    }

    const body = await res.json()
    const text = body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? ""
    if (!text.trim()) return { ok: false, reason: "Gemini returned an empty completion" }

    return { ok: true, text: text.trim() }
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Unknown Gemini request error" }
  }
}
