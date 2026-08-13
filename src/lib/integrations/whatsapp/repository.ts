import { randomUUID } from "node:crypto"
import { and, eq, desc } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import {
  integrationConnections,
  whatsappAccounts,
  whatsappConversations,
  whatsappMessages,
} from "@/lib/db/schema"

/**
 * Webhook deliveries arrive with no session/cookie — the workspace has to
 * be resolved from data IN the (still-unverified) payload, then the
 * signature is checked using that workspace's own stored secret before
 * anything is trusted. These lookups intentionally scan across all
 * workspaces (there is no authenticated caller yet to scope by).
 */
export interface WhatsAppWorkspaceContext {
  workspaceId: string
  wabaId: string
  phoneNumberId: string
  accessTokenEncrypted: string | null
  appSecretEncrypted: string | null
  verifyTokenEncrypted: string | null
}

export async function findWhatsAppContextByWaba(wabaId: string): Promise<WhatsAppWorkspaceContext | null> {
  return withDb(async (db) => {
    const rows = await db.select().from(integrationConnections).where(eq(integrationConnections.provider, "whatsapp"))
    const match = rows.find((r) => (r.config as Record<string, unknown>)?.wabaId === wabaId)
    if (!match) return null
    const config = match.config as Record<string, unknown>
    const secrets = match.secretDataEncrypted as Record<string, string>
    return {
      workspaceId: match.workspaceId,
      wabaId,
      phoneNumberId: (config.phoneNumberId as string) ?? "",
      accessTokenEncrypted: secrets.accessToken ?? null,
      appSecretEncrypted: secrets.appSecret ?? null,
      verifyTokenEncrypted: secrets.verifyToken ?? null,
    }
  })
}

export async function findWhatsAppContextByVerifyToken(verifyTokenPlaintext: string, decrypt: (blob: string) => string | null): Promise<boolean> {
  return withDb(async (db) => {
    const rows = await db.select().from(integrationConnections).where(eq(integrationConnections.provider, "whatsapp"))
    return rows.some((r) => {
      const secrets = r.secretDataEncrypted as Record<string, string>
      const blob = secrets.verifyToken
      if (!blob) return false
      const decrypted = decrypt(blob)
      return decrypted !== null && decrypted === verifyTokenPlaintext
    })
  })
}

export async function ensureWhatsAppAccount(
  workspaceId: string,
  integrationConnectionId: string | null,
  phoneNumberId: string,
  wabaId: string,
  displayPhoneNumber: string | null
) {
  return withDb(async (db) => {
    const existing = await db
      .select()
      .from(whatsappAccounts)
      .where(and(eq(whatsappAccounts.workspaceId, workspaceId), eq(whatsappAccounts.phoneNumberId, phoneNumberId)))
      .limit(1)
    if (existing[0]) return existing[0]

    const [created] = await db
      .insert(whatsappAccounts)
      .values({
        id: randomUUID(),
        workspaceId,
        integrationConnectionId,
        phoneNumberId,
        wabaId,
        displayPhoneNumber,
      })
      .returning()
    return created
  })
}

export async function ensureConversation(workspaceId: string, whatsappAccountId: string, contactPhone: string) {
  return withDb(async (db) => {
    const existing = await db
      .select()
      .from(whatsappConversations)
      .where(and(eq(whatsappConversations.whatsappAccountId, whatsappAccountId), eq(whatsappConversations.contactPhone, contactPhone)))
      .limit(1)
    if (existing[0]) return existing[0]

    const [created] = await db
      .insert(whatsappConversations)
      .values({ id: randomUUID(), workspaceId, whatsappAccountId, contactPhone })
      .returning()
    return created
  })
}

export async function getConversationById(workspaceId: string, conversationId: string) {
  return withDb(async (db) => {
    const rows = await db
      .select()
      .from(whatsappConversations)
      .where(and(eq(whatsappConversations.id, conversationId), eq(whatsappConversations.workspaceId, workspaceId)))
      .limit(1)
    return rows[0] ?? null
  })
}

export async function updateConversation(
  workspaceId: string,
  conversationId: string,
  patch: Partial<{ leadId: string | null; status: string; botState: Record<string, unknown>; lastMessageAt: Date }>
) {
  return withDb(async (db) => {
    const [updated] = await db
      .update(whatsappConversations)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(whatsappConversations.id, conversationId), eq(whatsappConversations.workspaceId, workspaceId)))
      .returning()
    return updated ?? null
  })
}

/** Returns `null` if this external message ID was already recorded for this
 * conversation — the caller's cue to skip reprocessing (idempotency). */
export async function insertInboundMessageIfNew(
  workspaceId: string,
  conversationId: string,
  externalMessageId: string,
  messageType: string,
  body: string | null,
  rawMetadata: Record<string, unknown>
) {
  return withDb(async (db) => {
    const existing = await db
      .select({ id: whatsappMessages.id })
      .from(whatsappMessages)
      .where(and(eq(whatsappMessages.conversationId, conversationId), eq(whatsappMessages.externalMessageId, externalMessageId)))
      .limit(1)
    if (existing[0]) return null

    const [created] = await db
      .insert(whatsappMessages)
      .values({
        id: randomUUID(),
        workspaceId,
        conversationId,
        externalMessageId,
        direction: "inbound",
        messageType,
        body,
        providerStatus: "received",
        sender: "customer",
        rawMetadata,
      })
      .returning()
    return created
  })
}

export async function insertOutboundMessage(
  workspaceId: string,
  conversationId: string,
  body: string,
  sender: "bot" | "agent",
  externalMessageId: string | null,
  providerStatus: "sent" | "failed"
) {
  return withDb(async (db) => {
    const [created] = await db
      .insert(whatsappMessages)
      .values({
        id: randomUUID(),
        workspaceId,
        conversationId,
        externalMessageId,
        direction: "outbound",
        messageType: "text",
        body,
        providerStatus,
        sender,
      })
      .returning()
    return created
  })
}

export async function listMessages(workspaceId: string, conversationId: string, limit = 50) {
  return withDb(async (db) => {
    const rows = await db
      .select()
      .from(whatsappMessages)
      .where(and(eq(whatsappMessages.conversationId, conversationId), eq(whatsappMessages.workspaceId, workspaceId)))
      .orderBy(desc(whatsappMessages.createdAt))
      .limit(limit)
    return rows.reverse()
  })
}

export async function listConversations(workspaceId: string, limit = 100) {
  return withDb(async (db) => {
    return db
      .select()
      .from(whatsappConversations)
      .where(eq(whatsappConversations.workspaceId, workspaceId))
      .orderBy(desc(whatsappConversations.lastMessageAt))
      .limit(limit)
  })
}
