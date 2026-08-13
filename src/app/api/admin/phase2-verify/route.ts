import { NextResponse } from "next/server"
import { randomUUID, randomBytes } from "node:crypto"
import { eq, sql, like } from "drizzle-orm"
import { z } from "zod"
import { withDb } from "@/lib/db/client"
import { users, workspaces, workspaceMembers, sessions, leads, leadActivities } from "@/lib/db/schema"
import { hashPassword, normalizeEmail } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import { apiError } from "@/lib/api/errors"

/**
 * Temporary, SETUP_TOKEN-gated Phase 2 verification tooling only.
 *
 * GET returns read-only bootstrap diagnostics (counts/roles, never
 * email/password) so first-owner bootstrap can be verified without a live
 * session. POST creates or tears down a synthetic test user + workspace so
 * auth/CRM/workspace-isolation can be exercised end-to-end without ever
 * touching the real owner's credentials.
 *
 * Fixtures are strictly confined to a reserved email domain
 * (`*@phase2-fixture.invalid`, RFC 2606 `.invalid`) and a fixed workspace
 * slug prefix (`phase2-fixture-`) — teardown only ever matches those exact
 * patterns, so it structurally cannot reach the real EasyLife workspace or
 * owner account.
 *
 * This file is deleted once Phase 2 verification is complete; it is not a
 * permanent admin surface.
 */

const FIXTURE_EMAIL_DOMAIN = "phase2-fixture.invalid"
const FIXTURE_SLUG_PREFIX = "phase2-fixture-"

function checkToken(request: Request): NextResponse | null {
  const expected = process.env.SETUP_TOKEN
  if (!expected) return NextResponse.json({ error: "Not enabled" }, { status: 403 })
  const provided = request.headers.get("x-setup-token")
  if (provided !== expected) return NextResponse.json({ error: "Invalid token" }, { status: 403 })
  return null
}

export async function GET(request: Request) {
  const denied = checkToken(request)
  if (denied) return denied

  try {
    const result = await withDb(async (db) => {
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users)
      const workspaceRows = await db.select({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug }).from(workspaces)
      const memberRows = await db
        .select({ role: workspaceMembers.role, workspaceId: workspaceMembers.workspaceId })
        .from(workspaceMembers)

      return {
        userCount: Number(userCount?.count ?? 0),
        workspaces: workspaceRows,
        memberships: memberRows,
      }
    })
    return NextResponse.json(result)
  } catch (error) {
    return apiError(error, "Diagnostics failed")
  }
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
      const password = randomBytes(18).toString("base64url")
      const passwordHash = await hashPassword(password)
      const userId = randomUUID()
      const workspaceId = randomUUID()
      const slug = `${FIXTURE_SLUG_PREFIX}${body.fixtureId}`

      await withDb(async (db) => {
        await db.insert(users).values({
          id: userId,
          email,
          normalizedEmail: normalizeEmail(email),
          name: `Phase 2 Fixture (${body.fixtureId})`,
          passwordHash,
        })
        await db.insert(workspaces).values({ id: workspaceId, name: `Phase 2 Fixture (${body.fixtureId})`, slug })
        await db.insert(workspaceMembers).values({ id: randomUUID(), workspaceId, userId, role: body.role })
      })

      const { cookieValue } = await createSession({ userId, workspaceId, rememberMe: false })

      return NextResponse.json({ userId, workspaceId, email, password, sessionCookie: cookieValue })
    }

    // teardown-fixtures: only ever touches rows matching the reserved
    // fixture email domain / slug prefix above — cannot reach real data.
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
