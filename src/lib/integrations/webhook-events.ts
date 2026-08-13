import { randomUUID } from "node:crypto"
import { eq, and } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { webhookEvents } from "@/lib/db/schema"

/**
 * Centralized webhook-event log shared by every webhook-capable provider.
 * This sits alongside (not instead of) a provider's own domain-specific
 * idempotency check (e.g. WhatsApp's UNIQUE(conversation_id,
 * external_message_id) on whatsapp_messages, which is the authoritative
 * dedupe for message content) - this table exists for cross-provider
 * observability/debugging without storing full raw payloads long-term.
 */

export interface RecordWebhookEventInput {
  provider: string
  workspaceId: string | null
  externalEventId?: string
  eventType?: string
  /** Small, sanitized summary only (e.g. message type + ids) - never the
   * full raw payload, and never a value that could contain a secret. */
  payloadSummary?: Record<string, unknown>
}

/** Returns the new row, or `null` if this (provider, externalEventId) pair
 * was already recorded - the caller's cue to skip reprocessing. Safe to
 * call even when externalEventId is absent (each such call is treated as
 * unique, since there's nothing to dedupe against). */
export async function recordWebhookEvent(input: RecordWebhookEventInput): Promise<{ id: string } | null> {
  return withDb(async (db) => {
    if (input.externalEventId) {
      const existing = await db
        .select({ id: webhookEvents.id })
        .from(webhookEvents)
        .where(and(eq(webhookEvents.provider, input.provider), eq(webhookEvents.externalEventId, input.externalEventId)))
        .limit(1)
      if (existing[0]) return null
    }

    const [created] = await db
      .insert(webhookEvents)
      .values({
        id: randomUUID(),
        provider: input.provider,
        workspaceId: input.workspaceId,
        externalEventId: input.externalEventId ?? null,
        eventType: input.eventType ?? null,
        payloadSummary: input.payloadSummary ?? null,
      })
      .returning({ id: webhookEvents.id })
    return created
  })
}

export async function markWebhookEventProcessed(id: string): Promise<void> {
  await withDb(async (db) => {
    await db
      .update(webhookEvents)
      .set({ processingStatus: "processed", processedAt: new Date() })
      .where(eq(webhookEvents.id, id))
  })
}

export async function markWebhookEventFailed(id: string, errorCode: string): Promise<void> {
  await withDb(async (db) => {
    await db
      .update(webhookEvents)
      .set({ processingStatus: "failed", errorCode, processedAt: new Date() })
      .where(eq(webhookEvents.id, id))
  })
}
