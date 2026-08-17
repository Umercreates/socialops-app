import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { workspaceSettings, workspaces } from "@/lib/db/schema"

export interface WorkspaceSettingsView {
  timezone: string
  defaultLanguage: string
  leadScoreThreshold: number
  humanHandoffRules: Record<string, unknown>
  notificationPreferences: Record<string, unknown>
}

const DEFAULTS: WorkspaceSettingsView = {
  timezone: "UTC",
  defaultLanguage: "en",
  leadScoreThreshold: 70,
  humanHandoffRules: {},
  notificationPreferences: {},
}

export async function getWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettingsView> {
  return withDb(async (db) => {
    const rows = await db.select().from(workspaceSettings).where(eq(workspaceSettings.workspaceId, workspaceId)).limit(1)
    const row = rows[0]
    if (!row) return DEFAULTS
    return {
      timezone: row.timezone,
      defaultLanguage: row.defaultLanguage,
      leadScoreThreshold: row.leadScoreThreshold,
      humanHandoffRules: row.humanHandoffRules as Record<string, unknown>,
      notificationPreferences: row.notificationPreferences as Record<string, unknown>,
    }
  })
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  patch: Partial<WorkspaceSettingsView>
): Promise<WorkspaceSettingsView> {
  return withDb(async (db) => {
    const existing = await db.select({ id: workspaceSettings.id }).from(workspaceSettings).where(eq(workspaceSettings.workspaceId, workspaceId)).limit(1)

    if (existing[0]) {
      await db
        .update(workspaceSettings)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(workspaceSettings.workspaceId, workspaceId))
    } else {
      await db.insert(workspaceSettings).values({ id: randomUUID(), workspaceId, ...DEFAULTS, ...patch })
    }

    return getWorkspaceSettings(workspaceId)
  })
}

/** The business/company name lives on the workspaces table itself (its
 * one identifying field), not workspace_settings - kept separate here so
 * callers that only need settings never touch the workspace's identity
 * record. */
export async function updateWorkspaceName(workspaceId: string, name: string): Promise<void> {
  await withDb(async (db) => {
    await db.update(workspaces).set({ name, updatedAt: new Date() }).where(eq(workspaces.id, workspaceId))
  })
}
