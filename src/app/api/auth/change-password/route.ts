import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { users } from "@/lib/db/schema"
import { hashPassword, verifyPassword, isPasswordStrongEnough, MIN_PASSWORD_LENGTH } from "@/lib/auth/password"
import { requireAuth } from "@/lib/auth/guard"
import { revokeAllUserSessions } from "@/lib/auth/session"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { apiError } from "@/lib/api/errors"

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
})

export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const body = schema.parse(await request.json())
    if (!isPasswordStrongEnough(body.newPassword)) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 })
    }

    const ok = await withDb(async (db) => {
      const rows = await db.select().from(users).where(eq(users.id, auth.ctx.userId)).limit(1)
      const user = rows[0]
      if (!user) return false

      const currentOk = await verifyPassword(body.currentPassword, user.passwordHash)
      if (!currentOk) return false

      const newHash = await hashPassword(body.newPassword)
      await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, user.id))
      return true
    })

    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 })
    }

    // Invalidate every other session — this one stays alive so the user
    // isn't logged out by their own password change.
    await revokeAllUserSessions(auth.ctx.userId, auth.ctx.sessionId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, "Failed to change password")
  }
}
