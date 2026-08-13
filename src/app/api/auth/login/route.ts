import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { users, workspaceMembers, workspaces } from "@/lib/db/schema"
import { normalizeEmail, verifyPassword } from "@/lib/auth/password"
import { createSession, SESSION_COOKIE } from "@/lib/auth/session"
import { isLoginRateLimited, recordLoginAttempt } from "@/lib/auth/rate-limit"
import { getClientIp } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { apiError } from "@/lib/api/errors"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
})

export async function POST(request: Request) {
  if (process.env.AUTH_MODE !== "production") {
    return NextResponse.json({ error: "Production authentication is not yet enabled" }, { status: 503 })
  }

  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const body = loginSchema.parse(await request.json())
    const normalizedEmail = normalizeEmail(body.email)
    const ip = await getClientIp()

    if (await isLoginRateLimited(normalizedEmail, ip)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
    }

    const result = await withDb(async (db) => {
      const userRows = await db.select().from(users).where(eq(users.normalizedEmail, normalizedEmail)).limit(1)
      const user = userRows[0]
      if (!user || user.status !== "active") return null

      const passwordOk = await verifyPassword(body.password, user.passwordHash)
      if (!passwordOk) return null

      const memberRows = await db
        .select({ workspaceId: workspaces.id, workspaceName: workspaces.name, role: workspaceMembers.role })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
        .where(and(eq(workspaceMembers.userId, user.id), eq(workspaces.status, "active")))
        .limit(1)
      const membership = memberRows[0]
      if (!membership) return null

      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id))

      return { user, membership }
    })

    if (!result) {
      await recordLoginAttempt(normalizedEmail, ip, false)
      return NextResponse.json({ error: "That email and password don't match our records." }, { status: 401 })
    }

    await recordLoginAttempt(normalizedEmail, ip, true)

    const { cookieValue, expiresAt } = await createSession({
      userId: result.user.id,
      workspaceId: result.membership.workspaceId,
      rememberMe: body.rememberMe,
      userAgent: request.headers.get("user-agent"),
      ip,
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    })

    return NextResponse.json({
      user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.membership.role },
      workspace: { id: result.membership.workspaceId, name: result.membership.workspaceName },
    })
  } catch (error) {
    return apiError(error, "Login failed")
  }
}
