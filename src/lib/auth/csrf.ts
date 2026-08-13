import { NextResponse } from "next/server"

/**
 * Minimal same-origin check for cookie-authenticated, state-changing
 * requests. Browsers always send `Origin` on cross-site fetch/form
 * submissions; a same-site request either omits it or matches the app's
 * own origin. This is the "at minimum" bar Phase 2 calls for — not a full
 * CSRF-token system, which cookie + strict SameSite already covers for
 * most of the same threat model.
 */
export function verifySameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin")
  if (!origin) return null // same-site requests commonly omit Origin

  const host = request.headers.get("host")
  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 })
  }

  if (!host || originHost !== host) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 })
  }
  return null
}
