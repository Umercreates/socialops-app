import { randomUUID } from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { googleSheetsSyncedRows } from "@/lib/db/schema"

export interface SyncedRow {
  leadId: string
  spreadsheetId: string
  worksheetName: string
  rowNumber: number
}

/** The row a lead already synced to, if any - only meaningful for the
 * currently-selected spreadsheet/worksheet; a stale mapping from a
 * workspace's previous spreadsheet selection is deliberately never reused
 * (see upsertSyncedRow), so this only returns a mapping that still
 * matches. */
export async function getSyncedRow(
  workspaceId: string,
  leadId: string,
  spreadsheetId: string,
  worksheetName: string
): Promise<SyncedRow | null> {
  return withDb(async (db) => {
    const rows = await db
      .select()
      .from(googleSheetsSyncedRows)
      .where(and(eq(googleSheetsSyncedRows.workspaceId, workspaceId), eq(googleSheetsSyncedRows.leadId, leadId)))
      .limit(1)
    const row = rows[0]
    if (!row || row.spreadsheetId !== spreadsheetId || row.worksheetName !== worksheetName) return null
    return { leadId: row.leadId, spreadsheetId: row.spreadsheetId, worksheetName: row.worksheetName, rowNumber: row.rowNumber }
  })
}

export interface RecordSyncInput {
  workspaceId: string
  leadId: string
  spreadsheetId: string
  worksheetName: string
  rowNumber: number
  status: "synced" | "failed"
  error?: string
}

/** One row of tracking state per (workspace, lead) - switching the
 * spreadsheet/worksheet selection naturally starts every lead fresh next
 * sync, since this always overwrites with the current target rather than
 * keeping history. */
export async function recordSyncResult(input: RecordSyncInput): Promise<void> {
  await withDb(async (db) => {
    const existing = await db
      .select({ id: googleSheetsSyncedRows.id })
      .from(googleSheetsSyncedRows)
      .where(and(eq(googleSheetsSyncedRows.workspaceId, input.workspaceId), eq(googleSheetsSyncedRows.leadId, input.leadId)))
      .limit(1)

    const values = {
      spreadsheetId: input.spreadsheetId,
      worksheetName: input.worksheetName,
      rowNumber: input.rowNumber,
      lastSyncedAt: new Date(),
      lastStatus: input.status,
      lastError: input.status === "failed" ? (input.error ?? "Unknown error") : null,
      updatedAt: new Date(),
    }

    if (existing[0]) {
      await db.update(googleSheetsSyncedRows).set(values).where(eq(googleSheetsSyncedRows.id, existing[0].id))
      return
    }

    await db.insert(googleSheetsSyncedRows).values({
      id: randomUUID(),
      workspaceId: input.workspaceId,
      leadId: input.leadId,
      ...values,
    })
  })
}

export interface SyncSummary {
  lastSyncedAt: string | null
  totalSynced: number
  lastError: string | null
}

/** Rolled-up "how's syncing going" view for the Integrations Center card -
 * not a single record, since sync happens per-lead; this summarizes
 * across every lead this workspace has ever synced. */
export async function getSyncSummary(workspaceId: string): Promise<SyncSummary> {
  return withDb(async (db) => {
    const rows = await db
      .select()
      .from(googleSheetsSyncedRows)
      .where(eq(googleSheetsSyncedRows.workspaceId, workspaceId))
      .orderBy(desc(googleSheetsSyncedRows.lastSyncedAt))

    const totalSynced = rows.filter((r) => r.lastStatus === "synced").length
    const mostRecent = rows[0]
    const mostRecentFailure = rows.find((r) => r.lastStatus === "failed")
    return {
      lastSyncedAt: mostRecent?.lastSyncedAt?.toISOString() ?? null,
      totalSynced,
      lastError: mostRecent?.lastStatus === "failed" ? (mostRecentFailure?.lastError ?? null) : null,
    }
  })
}
