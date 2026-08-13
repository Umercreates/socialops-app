import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionCookie, revokeSession, SESSION_COOKIE } from "@/lib/auth/session"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { apiError } from "@/lib/api/errors"

export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get(SESSION_COOKIE)?.value
    const session = await verifySessionCookie(raw)
    if (session) {
      await revokeSession(session.sessionId)
    }
    cookieStore.delete(SESSION_COOKIE)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, "Logout failed")
  }
}
