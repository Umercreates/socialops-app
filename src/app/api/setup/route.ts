import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { sql } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { users, workspaces, workspaceMembers } from "@/lib/db/schema"
import { hashPassword, isPasswordStrongEnough, normalizeEmail, MIN_PASSWORD_LENGTH } from "@/lib/auth/password"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { apiError } from "@/lib/api/errors"

/**
 * One-time first-owner bootstrap. Permanently self-disables the moment any
 * user exists — not just gated by SETUP_TOKEN, so even a leaked token can't
 * create a second account once setup has genuinely run once. Requires the
 * SETUP_TOKEN header on top of that as a second factor while the workspace
 * is still empty. Remove SETUP_TOKEN from the production environment after
 * first use.
 */

const setupSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(1),
})

export async function GET() {
  try {
    const hasUsers = await withDb(async (db) => {
      const rows = await db.select({ count: sql<number>`count(*)` }).from(users)
      return Number(rows[0]?.count ?? 0) > 0
    })
    return NextResponse.json({ available: !hasUsers })
  } catch (error) {
    return apiError(error, "Failed to check setup status")
  }
}

export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  const expectedToken = process.env.SETUP_TOKEN
  if (!expectedToken) {
    return NextResponse.json({ error: "Setup is not enabled" }, { status: 403 })
  }
  const providedToken = request.headers.get("x-setup-token")
  if (providedToken !== expectedToken) {
    return NextResponse.json({ error: "Invalid setup token" }, { status: 403 })
  }

  try {
    const body = setupSchema.parse(await request.json())
    if (!isPasswordStrongEnough(body.password)) {
      return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 })
    }
    const normalizedEmail = normalizeEmail(body.email)

    const result = await withDb(async (db) => {
      // Re-check inside the same DB round-trip window — the true guarantee
      // is the UNIQUE constraint on normalized_email plus this count check;
      // this is not a hard transaction-level lock, but first-run bootstrap
      // is not a high-concurrency path.
      const existing = await db.select({ count: sql<number>`count(*)` }).from(users)
      if (Number(existing[0]?.count ?? 0) > 0) {
        return { error: "Setup has already been completed" as const }
      }

      const passwordHash = await hashPassword(body.password)
      const userId = randomUUID()
      const workspaceId = randomUUID()

      await db.insert(users).values({
        id: userId,
        email: body.email.trim(),
        normalizedEmail,
        name: body.name,
        passwordHash,
      })

      await db.insert(workspaces).values({
        id: workspaceId,
        name: "EasyLife",
        slug: "easylife",
      })

      await db.insert(workspaceMembers).values({
        id: randomUUID(),
        workspaceId,
        userId,
        role: "owner",
      })

      return { userId, workspaceId }
    })

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, "Setup failed")
  }
}
