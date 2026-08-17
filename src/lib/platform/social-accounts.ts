import { randomUUID } from "node:crypto"
import { and, eq, inArray } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { socialAccounts } from "@/lib/db/schema"
import type { SocialAccount, ConnectionHealth, SocialPlatform } from "@/types"

/** Maps a DB row to the existing SocialAccount UI type - the Accounts page
 * consumes this unchanged. */
function rowToSocialAccount(row: typeof socialAccounts.$inferSelect): SocialAccount {
  return {
    id: row.id,
    platform: row.provider as SocialPlatform,
    displayName: row.accountName,
    handle: row.username ?? "",
    followers: row.followers,
    followersDelta30d: row.followersDelta30d,
    health: row.status as ConnectionHealth,
    connectedAt: row.connectedAt?.toISOString() ?? null,
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    profileImageUrl: row.avatarUrl ?? undefined,
  }
}

export async function listSocialAccounts(workspaceId: string): Promise<SocialAccount[]> {
  return withDb(async (db) => {
    const rows = await db.select().from(socialAccounts).where(eq(socialAccounts.workspaceId, workspaceId))
    return rows.map(rowToSocialAccount)
  })
}

/** Resolves specific accounts by id, scoped to the workspace - used to
 * validate a client-supplied target list and to look up each account's
 * real provider server-side (a post target's provider is never trusted
 * from client input, only derived from the account record itself). */
export async function getSocialAccountsByIds(workspaceId: string, ids: string[]): Promise<{ id: string; provider: string }[]> {
  if (ids.length === 0) return []
  return withDb(async (db) => {
    const rows = await db
      .select({ id: socialAccounts.id, provider: socialAccounts.provider })
      .from(socialAccounts)
      .where(and(eq(socialAccounts.workspaceId, workspaceId), inArray(socialAccounts.id, ids)))
    return rows
  })
}

export interface UpsertSocialAccountInput {
  workspaceId: string
  provider: string
  integrationConnectionId?: string | null
  externalAccountId: string
  accountName: string
  username?: string | null
  avatarUrl?: string | null
  accountType?: string | null
  capabilities?: string[]
}

/** Called once a provider adapter has real account data (OAuth-connected
 * account list). Never invented client-side - the row only exists once a
 * real provider handshake has returned real account identifiers. */
export async function upsertSocialAccount(input: UpsertSocialAccountInput): Promise<SocialAccount> {
  return withDb(async (db) => {
    const existing = await db
      .select()
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.workspaceId, input.workspaceId),
          eq(socialAccounts.provider, input.provider),
          eq(socialAccounts.externalAccountId, input.externalAccountId)
        )
      )
      .limit(1)

    if (existing[0]) {
      const [updated] = await db
        .update(socialAccounts)
        .set({
          accountName: input.accountName,
          username: input.username,
          avatarUrl: input.avatarUrl,
          accountType: input.accountType,
          capabilities: input.capabilities ?? existing[0].capabilities,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(socialAccounts.id, existing[0].id))
        .returning()
      return rowToSocialAccount(updated)
    }

    const [created] = await db
      .insert(socialAccounts)
      .values({
        id: randomUUID(),
        workspaceId: input.workspaceId,
        provider: input.provider,
        integrationConnectionId: input.integrationConnectionId ?? null,
        externalAccountId: input.externalAccountId,
        accountName: input.accountName,
        username: input.username,
        avatarUrl: input.avatarUrl,
        accountType: input.accountType,
        capabilities: input.capabilities ?? [],
        connectedAt: new Date(),
        lastSyncAt: new Date(),
      })
      .returning()
    return rowToSocialAccount(created)
  })
}

export async function disconnectSocialAccount(workspaceId: string, accountId: string): Promise<void> {
  await withDb(async (db) => {
    await db
      .update(socialAccounts)
      .set({ status: "disconnected", updatedAt: new Date() })
      .where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.workspaceId, workspaceId)))
  })
}

/** Marks every social_accounts row for a provider disconnected - used when
 * the underlying integration_connections row is disabled/removed, so an
 * account never keeps showing as connected (and selectable to publish to)
 * after its credentials are gone. Row itself is kept, never deleted -
 * publish history stays intact. */
export async function disconnectSocialAccountsByProvider(workspaceId: string, provider: string): Promise<void> {
  await withDb(async (db) => {
    await db
      .update(socialAccounts)
      .set({ status: "disconnected", updatedAt: new Date() })
      .where(and(eq(socialAccounts.workspaceId, workspaceId), eq(socialAccounts.provider, provider)))
  })
}
