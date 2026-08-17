import { randomUUID, randomBytes } from "node:crypto"
import { and, eq, ne, sql } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { users, workspaceMembers, sessions } from "@/lib/db/schema"
import { hashPassword, normalizeEmail } from "@/lib/auth/password"

export type TeamRole = "owner" | "admin" | "manager" | "sales"

export interface TeamMemberRow {
  id: string
  userId: string
  name: string
  email: string
  role: TeamRole
  status: string
  createdAt: string
}

export async function listWorkspaceMembers(workspaceId: string): Promise<TeamMemberRow[]> {
  return withDb(async (db) => {
    const rows = await db
      .select({
        id: workspaceMembers.id,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        createdAt: workspaceMembers.createdAt,
        name: users.name,
        email: users.email,
        status: users.status,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(users.id, workspaceMembers.userId))
      .where(eq(workspaceMembers.workspaceId, workspaceId))
    return rows.map((r) => ({ ...r, role: r.role as TeamRole, createdAt: r.createdAt.toISOString() }))
  })
}

export interface InviteMemberInput {
  workspaceId: string
  name: string
  email: string
  role: TeamRole
}

export type InviteMemberResult = { ok: true; member: TeamMemberRow; temporaryPassword: string } | { ok: false; error: string }

/** No email provider exists in this app (see forgot-password-form.tsx's
 * own honest empty state) - an admin-provisioned account with a one-time
 * temporary password is the real, honest alternative: the owner/admin
 * shares it with the new member through whatever channel they choose, and
 * the member can change it via the already-real /api/auth/change-password
 * once signed in. The temp password is returned exactly once, in this
 * response only - never stored in plaintext, never logged, never
 * retrievable again after this call returns. */
export async function inviteMember(input: InviteMemberInput): Promise<InviteMemberResult> {
  const normalizedEmail = normalizeEmail(input.email)

  return withDb(async (db) => {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.normalizedEmail, normalizedEmail)).limit(1)
    if (existing[0]) return { ok: false, error: "A user with this email already exists." }

    const temporaryPassword = randomBytes(12).toString("base64url")
    const passwordHash = await hashPassword(temporaryPassword)
    const userId = randomUUID()
    const memberId = randomUUID()

    const [userRow] = await db
      .insert(users)
      .values({ id: userId, email: input.email.trim(), normalizedEmail, name: input.name.trim(), passwordHash })
      .returning()
    const [memberRow] = await db
      .insert(workspaceMembers)
      .values({ id: memberId, workspaceId: input.workspaceId, userId, role: input.role })
      .returning()

    return {
      ok: true,
      member: { id: memberRow.id, userId, name: userRow.name, email: userRow.email, role: input.role, status: userRow.status, createdAt: memberRow.createdAt.toISOString() },
      temporaryPassword,
    }
  })
}

export type UpdateRoleResult = { ok: true } | { ok: false; error: string }

/** Refuses to demote the workspace's last remaining owner - a workspace
 * with zero owners would have no one able to manage billing/team/
 * ownership-level settings, an unrecoverable state without direct DB
 * access. */
export async function updateMemberRole(workspaceId: string, memberId: string, role: TeamRole): Promise<UpdateRoleResult> {
  return withDb(async (db) => {
    const target = await db.select().from(workspaceMembers).where(and(eq(workspaceMembers.id, memberId), eq(workspaceMembers.workspaceId, workspaceId))).limit(1)
    if (!target[0]) return { ok: false, error: "Member not found." }

    if (target[0].role === "owner" && role !== "owner") {
      const otherOwners = await db
        .select({ count: sql<number>`count(*)` })
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.role, "owner"), ne(workspaceMembers.id, memberId)))
      if (Number(otherOwners[0]?.count ?? 0) === 0) return { ok: false, error: "A workspace needs at least one owner - promote another member to owner first." }
    }

    await db.update(workspaceMembers).set({ role, updatedAt: new Date() }).where(eq(workspaceMembers.id, memberId))
    return { ok: true }
  })
}

export type RemoveMemberResult = { ok: true } | { ok: false; error: string }

/** Removes this member's access to the workspace (deletes the
 * workspace_members row and revokes their active sessions) but keeps
 * their users row intact - other tables reference a user id for
 * historical attribution (who created this lead, who ran this
 * automation), and deleting it would either orphan or cascade-delete real
 * history that should survive an offboarding. */
export async function removeMember(workspaceId: string, memberId: string): Promise<RemoveMemberResult> {
  return withDb(async (db) => {
    const target = await db.select().from(workspaceMembers).where(and(eq(workspaceMembers.id, memberId), eq(workspaceMembers.workspaceId, workspaceId))).limit(1)
    if (!target[0]) return { ok: false, error: "Member not found." }

    if (target[0].role === "owner") {
      const otherOwners = await db
        .select({ count: sql<number>`count(*)` })
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.role, "owner"), ne(workspaceMembers.id, memberId)))
      if (Number(otherOwners[0]?.count ?? 0) === 0) return { ok: false, error: "A workspace needs at least one owner - promote another member to owner before removing this one." }
    }

    await db.delete(workspaceMembers).where(eq(workspaceMembers.id, memberId))
    await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, target[0].userId), eq(sessions.workspaceId, workspaceId)))
    return { ok: true }
  })
}
