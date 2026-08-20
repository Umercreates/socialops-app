import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { DASHBOARD_MODE_COOKIE, getDashboardViewMode, hasRealBackend } from "@/lib/dashboard-view-mode"
import { apiError } from "@/lib/api/errors"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const mode = await getDashboardViewMode()
    return NextResponse.json({ mode })
  } catch (error) {
    return apiError(error, "Failed to load dashboard mode")
  }
}

const bodySchema = z.object({ mode: z.enum(["demo", "client"]) })

/** Sets the caller's dashboard view mode cookie - a per-user runtime
 * preference, not an authorization change. Requires a valid session (this
 * is a real user's dashboard setting, not a public toggle) but doesn't
 * gate on role - any workspace member may switch their own view between
 * demo and client. */
export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const body = bodySchema.parse(await request.json())

    // Nothing real to switch to without backing infrastructure - always demo.
    const effectiveMode = hasRealBackend() ? body.mode : "demo"

    const response = NextResponse.json({ mode: effectiveMode })
    response.cookies.set(DASHBOARD_MODE_COOKIE, effectiveMode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
    return response
  } catch (error) {
    return apiError(error, "Failed to update dashboard mode")
  }
}
