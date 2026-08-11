import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Route gate for the mock authentication layer. This only checks for the
 * presence of the demo session cookie set by `lib/auth/mock-auth.ts` — it is
 * NOT a real security boundary. Swap this for real session verification when
 * a real auth provider replaces the mock layer.
 */
const SESSION_COOKIE = "so_session"
const AUTH_PAGES = ["/login", "/forgot-password", "/reset-password"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has(SESSION_COOKIE)

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
  matcher: ["/", "/dashboard/:path*", "/login", "/forgot-password", "/reset-password"],
}
