import { cache } from "react"
import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { SESSION_COOKIE, verifySessionCookie } from "@/lib/auth/session"
import { withDb } from "@/lib/db/client"
import { users, workspaceMembers, workspaces } from "@/lib/db/schema"

/**
 * Central server-side auth + workspace + role guard for API routes.
 * UI/proxy route protection is not security on its own — every sensitive
 * API independently re-verifies here, per Phase 2's explicit requirement.
 */

export type WorkspaceRole = "owner" | "admin" | "manager" | "sales"

export interface AuthContext {
  userId: string
  userName: string
  userEmail: string
  workspaceId: string
  workspaceName: string
  role: WorkspaceRole
  sessionId: string
}

type GuardResult = { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse }

function unauthorized(message = "Authentication required"): GuardResult {
  return { ok: false, response: NextResponse.json({ error: message }, { status: 401 }) }
}

function serviceUnavailable(): GuardResult {
  return {
    ok: false,
    response: NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 }),
  }
}

/** Resolves the authenticated user + their active workspace membership from
 * the session cookie. Always fails closed: any DB error, missing session,
 * revoked session, or missing membership returns `ok: false`, never a
 * default/fake identity.
 *
 * Wrapped in React's request-scoped `cache()`: the dashboard layout and
 * every page/component under it independently call this (per Phase 2's
 * "every sensitive read re-verifies" rule), which previously meant the same
 * session+user+workspace join query ran twice per page load. `cache()`
 * memoizes the result only for the lifetime of this one request/render -
 * it is NOT a cross-request or cross-user cache, so no auth data ever
 * leaks between requests. */
export const requireAuth = cache(async (): Promise<GuardResult> => {
  if (process.env.AUTH_MODE !== "production") {
    return unauthorized("Production authentication is not yet enabled")
  }

  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  const session = await verifySessionCookie(raw)
  if (!session || !session.workspaceId) return unauthorized()
  const { userId: sessionUserId, workspaceId: sessionWorkspaceId } = session

  try {
    const ctx = await withDb(async (db) => {
      const rows = await db
        .select({
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          userStatus: users.status,
          workspaceId: workspaces.id,
          workspaceName: workspaces.name,
          workspaceStatus: workspaces.status,
          role: workspaceMembers.role,
        })
        .from(workspaceMembers)
        .innerJoin(users, eq(workspaceMembers.userId, users.id))
        .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
        .where(and(eq(workspaceMembers.userId, sessionUserId), eq(workspaceMembers.workspaceId, sessionWorkspaceId)))
        .limit(1)

      const row = rows[0]
      if (!row || row.userStatus !== "active" || row.workspaceStatus !== "active") return null

      return {
        userId: row.userId,
        userName: row.userName,
        userEmail: row.userEmail,
        workspaceId: row.workspaceId,
        workspaceName: row.workspaceName,
        role: row.role as WorkspaceRole,
        sessionId: session.sessionId,
      }
    })

    if (!ctx) return unauthorized()
    return { ok: true, ctx }
  } catch {
    return serviceUnavailable()
  }
})

/** Reusable role gate — keeps authorization centralized instead of scattered
 * `if (role === ...)` checks throughout route handlers. */
export function requireRole(ctx: AuthContext, allowed: WorkspaceRole[]): NextResponse | null {
  if (!allowed.includes(ctx.role)) {
    return NextResponse.json({ error: "You don't have permission to do that" }, { status: 403 })
  }
  return null
}

/** Best-effort client IP for rate limiting / session metadata — trusts
 * X-Forwarded-For since Passenger sits behind Apache's proxy. */
export async function getClientIp(): Promise<string | null> {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null
  return null
}
