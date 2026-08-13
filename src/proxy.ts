import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE as PRODUCTION_SESSION_COOKIE, verifySessionCookie } from "@/lib/auth/session"

/**
 * Route gate for /dashboard/**. Branches on AUTH_MODE so production auth can
 * roll out safely without ever silently falling back to the mock bypass:
 *
 * - AUTH_MODE=mock (default during migration): same cookie-presence check
 *   as before — zero behavior change to the currently-live site.
 * - AUTH_MODE=production: verifies the real session against the database
 *   (Next 16 defaults Proxy to the Node.js runtime, so this DB call is
 *   safe here, unlike the old Edge-runtime Middleware). An invalid/expired/
 *   revoked session or a DB failure both redirect to /login — this file
 *   never treats "couldn't verify" as "let them in."
 *
 * This is UI-level protection only — every sensitive API independently
 * re-verifies auth + workspace in src/lib/auth/guard.ts. Do not rely on
 * this file alone.
 */
const MOCK_SESSION_COOKIE = "so_session"
const AUTH_PAGES = ["/login", "/forgot-password", "/reset-password"]

async function hasValidSession(request: NextRequest): Promise<boolean> {
  if (process.env.AUTH_MODE === "production") {
    const raw = request.cookies.get(PRODUCTION_SESSION_COOKIE)?.value
    const session = await verifySessionCookie(raw)
    return session !== null
  }
  return request.cookies.has(MOCK_SESSION_COOKIE)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = await hasValidSession(request)

  if (pathname === "/") {
    return NextResponse.redirect(new URL(hasSession ? "/dashboard" : "/login", request.url))
  }

  if (pathname.startsWith("/dashboard") && !hasSession) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (AUTH_PAGES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // "/dashboard/:path*" requires the literal trailing slash to match, so it
  // does NOT match the bare "/dashboard" route on its own — both are listed
  // explicitly so the dashboard root is never left unprotected.
  matcher: ["/", "/dashboard", "/dashboard/:path*", "/login", "/forgot-password", "/reset-password"],
}
