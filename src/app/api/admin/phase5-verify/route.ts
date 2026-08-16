import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { eq, like } from "drizzle-orm"
import { z } from "zod"
import { withDb } from "@/lib/db/client"
import { users, workspaces, workspaceMembers, sessions, leads, leadActivities, calls, integrationConnections } from "@/lib/db/schema"
import { hashPassword, normalizeEmail } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import { apiError } from "@/lib/api/errors"

/**
 * Temporary, SETUP_TOKEN-gated Phase 5 verification tooling - same pattern
 * used for Phase 2/3/4. Creates/tears down a synthetic test user + workspace
 * so the OmniDimension backend and other Phase 5 work can be exercised
 * end-to-end without touching the real owner's account. Fixtures confined
 * to a reserved *@phase5-fixture.invalid email domain and a
 * phase5-fixture- workspace slug prefix. Deleted from source once
 * verification is complete.
 */

const FIXTURE_EMAIL_DOMAIN = "phase5-fixture.invalid"
const FIXTURE_SLUG_PREFIX = "phase5-fixture-"

function checkToken(request: Request): NextResponse | null {
  const expected = process.env.SETUP_TOKEN
  if (!expected) return NextResponse.json({ error: "Not enabled" }, { status: 403 })
  const provided = request.headers.get("x-setup-token")
  if (provided !== expected) return NextResponse.json({ error: "Invalid token" }, { status: 403 })
  return null
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create-fixture"),
    fixtureId: z.string().regex(/^[a-z0-9-]{3,30}$/),
    role: z.enum(["owner", "admin", "manager", "sales"]).default("owner"),
  }),
  z.object({ action: z.literal("teardown-fixtures") }),
])

export async function POST(request: Request) {
  const denied = checkToken(request)
  if (denied) return denied

  try {
    const body = actionSchema.parse(await request.json())

    if (body.action === "create-fixture") {
      const email = `${body.fixtureId}@${FIXTURE_EMAIL_DOMAIN}`
      const password = randomUUID()
      const passwordHash = await hashPassword(password)
      const userId = randomUUID()
      const workspaceId = randomUUID()
      const slug = `${FIXTURE_SLUG_PREFIX}${body.fixtureId}`

      await withDb(async (db) => {
        await db.insert(users).values({
          id: userId,
          email,
          normalizedEmail: normalizeEmail(email),
          name: `Phase 5 Fixture (${body.fixtureId})`,
          passwordHash,
        })
        await db.insert(workspaces).values({ id: workspaceId, name: `Phase 5 Fixture (${body.fixtureId})`, slug })
        await db.insert(workspaceMembers).values({ id: randomUUID(), workspaceId, userId, role: body.role })
      })

      const { cookieValue } = await createSession({ userId, workspaceId, rememberMe: false })
      return NextResponse.json({ userId, workspaceId, email, sessionCookie: cookieValue })
    }

    const summary = await withDb(async (db) => {
      const fixtureWorkspaces = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(like(workspaces.slug, `${FIXTURE_SLUG_PREFIX}%`))
      const workspaceIds = fixtureWorkspaces.map((w) => w.id)

      const fixtureUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(like(users.normalizedEmail, `%@${FIXTURE_EMAIL_DOMAIN}`))
      const userIds = fixtureUsers.map((u) => u.id)

      for (const workspaceId of workspaceIds) {
        await db.delete(calls).where(eq(calls.workspaceId, workspaceId))
        await db.delete(integrationConnections).where(eq(integrationConnections.workspaceId, workspaceId))
        await db.delete(leadActivities).where(eq(leadActivities.workspaceId, workspaceId))
        await db.delete(leads).where(eq(leads.workspaceId, workspaceId))
        await db.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId))
      }
      for (const userId of userIds) {
        await db.delete(sessions).where(eq(sessions.userId, userId))
      }
      for (const workspaceId of workspaceIds) {
        await db.delete(workspaces).where(eq(workspaces.id, workspaceId))
      }
      for (const userId of userIds) {
        await db.delete(users).where(eq(users.id, userId))
      }

      return { workspacesRemoved: workspaceIds.length, usersRemoved: userIds.length }
    })

    return NextResponse.json(summary)
  } catch (error) {
    return apiError(error, "Fixture operation failed")
  }
}
