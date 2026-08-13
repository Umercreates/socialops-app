import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { automations, automationRuns } from "@/lib/db/schema"
import type { Automation, AutomationStatus, AutomationStep, AutomationTriggerType, AutomationConditionType, AutomationActionType, AutomationRules, SocialPlatform } from "@/types"

function rowToAutomation(row: typeof automations.$inferSelect): Automation {
  return {
    id: row.id,
    name: row.name,
    status: row.status as AutomationStatus,
    platform: row.platform as SocialPlatform | "all",
    trigger: row.trigger as AutomationStep<AutomationTriggerType>,
    condition: row.condition as AutomationStep<AutomationConditionType>,
    action: row.action as AutomationStep<AutomationActionType>,
    rules: row.rules as AutomationRules,
    runsLast30d: row.runsLast30d,
    lastRunAt: row.lastRunAt?.toISOString() ?? null,
  }
}

export async function listAutomations(workspaceId: string): Promise<Automation[]> {
  return withDb(async (db) => {
    const rows = await db.select().from(automations).where(eq(automations.workspaceId, workspaceId))
    return rows.map(rowToAutomation)
  })
}

export interface CreateAutomationInput {
  workspaceId: string
  name: string
  platform: SocialPlatform | "all"
  trigger: AutomationStep<AutomationTriggerType>
  condition: AutomationStep<AutomationConditionType>
  action: AutomationStep<AutomationActionType>
  rules: AutomationRules
}

export async function createAutomation(input: CreateAutomationInput): Promise<Automation> {
  return withDb(async (db) => {
    const [row] = await db
      .insert(automations)
      .values({
        id: randomUUID(),
        workspaceId: input.workspaceId,
        name: input.name,
        platform: input.platform,
        trigger: input.trigger,
        condition: input.condition,
        action: input.action,
        rules: input.rules,
      })
      .returning()
    return rowToAutomation(row)
  })
}

export interface UpdateAutomationInput {
  name?: string
  status?: AutomationStatus
  platform?: SocialPlatform | "all"
  trigger?: AutomationStep<AutomationTriggerType>
  condition?: AutomationStep<AutomationConditionType>
  action?: AutomationStep<AutomationActionType>
  rules?: AutomationRules
}

export async function updateAutomation(workspaceId: string, id: string, patch: UpdateAutomationInput): Promise<Automation | null> {
  return withDb(async (db) => {
    const [row] = await db
      .update(automations)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(automations.id, id), eq(automations.workspaceId, workspaceId)))
      .returning()
    return row ? rowToAutomation(row) : null
  })
}

export async function deleteAutomation(workspaceId: string, id: string): Promise<void> {
  await withDb(async (db) => {
    await db.delete(automations).where(and(eq(automations.id, id), eq(automations.workspaceId, workspaceId)))
  })
}

/**
 * Records an automation run. Before ANY provider-facing action executes,
 * the caller must have already confirmed the relevant provider is
 * connected/live - a run against a provider that isn't ready gets recorded
 * as "blocked" with a clear reason, never silently treated as if the
 * external action happened.
 */
export async function recordAutomationRun(
  workspaceId: string,
  automationId: string,
  status: "completed" | "blocked" | "failed",
  errorMessage?: string,
  triggerContext?: Record<string, unknown>
): Promise<void> {
  await withDb(async (db) => {
    await db.insert(automationRuns).values({
      id: randomUUID(),
      automationId,
      workspaceId,
      triggerContext: triggerContext ?? null,
      status,
      errorMessage,
      completedAt: new Date(),
    })

    if (status === "completed") {
      const [current] = await db.select({ runsLast30d: automations.runsLast30d }).from(automations).where(eq(automations.id, automationId))
      await db
        .update(automations)
        .set({ runsLast30d: (current?.runsLast30d ?? 0) + 1, lastRunAt: new Date(), updatedAt: new Date() })
        .where(eq(automations.id, automationId))
    }
  })
}
