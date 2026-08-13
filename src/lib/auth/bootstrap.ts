import { randomUUID } from "node:crypto"
import { sql } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { users, workspaces, workspaceMembers } from "@/lib/db/schema"
import { hashPassword, normalizeEmail } from "@/lib/auth/password"

/** Shared first-owner bootstrap logic used by both /api/setup (token-gated,
 * for direct API verification) and the /setup page's Server Action (the
 * real user-facing path — no token ever reaches client JS there, since the
 * Server Action runs entirely server-side). The true guarantee either way
 * is the same: this only ever succeeds once, while zero users exist. */

export async function hasAnyUsers(): Promise<boolean> {
  return withDb(async (db) => {
    const rows = await db.select({ count: sql<number>`count(*)` }).from(users)
    return Number(rows[0]?.count ?? 0) > 0
  })
}

export interface BootstrapInput {
  name: string
  email: string
  password: string
}

export type BootstrapResult = { ok: true } | { ok: false; error: string }

export async function bootstrapFirstOwner(input: BootstrapInput): Promise<BootstrapResult> {
  const normalizedEmail = normalizeEmail(input.email)

  const result = await withDb(async (db): Promise<{ error: string } | { userId: string; workspaceId: string }> => {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(users)
    if (Number(existing[0]?.count ?? 0) > 0) {
      return { error: "Setup has already been completed" }
    }

    const passwordHash = await hashPassword(input.password)
    const userId = randomUUID()
    const workspaceId = randomUUID()

    await db.insert(users).values({
      id: userId,
      email: input.email.trim(),
      normalizedEmail,
      name: input.name,
      passwordHash,
    })

    await db.insert(workspaces).values({ id: workspaceId, name: "EasyLife", slug: "easylife" })

    await db.insert(workspaceMembers).values({ id: randomUUID(), workspaceId, userId, role: "owner" })

    return { userId, workspaceId }
  })

  if ("error" in result) return { ok: false, error: result.error }
  return { ok: true }
}
