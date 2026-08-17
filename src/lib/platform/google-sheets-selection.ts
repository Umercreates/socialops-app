import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { googleSheetsSelections } from "@/lib/db/schema"

export interface GoogleSheetsSelection {
  spreadsheetId: string
  spreadsheetName: string | null
  worksheetName: string
  columnMapping: Record<string, string>
  updatedAt: string
}

function rowToSelection(row: typeof googleSheetsSelections.$inferSelect): GoogleSheetsSelection {
  return {
    spreadsheetId: row.spreadsheetId,
    spreadsheetName: row.spreadsheetName,
    worksheetName: row.worksheetName,
    columnMapping: row.columnMapping as Record<string, string>,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function getGoogleSheetsSelection(workspaceId: string): Promise<GoogleSheetsSelection | null> {
  return withDb(async (db) => {
    const rows = await db.select().from(googleSheetsSelections).where(eq(googleSheetsSelections.workspaceId, workspaceId)).limit(1)
    return rows[0] ? rowToSelection(rows[0]) : null
  })
}

export interface SaveGoogleSheetsSelectionInput {
  workspaceId: string
  spreadsheetId: string
  spreadsheetName?: string
  worksheetName: string
  columnMapping?: Record<string, string>
  selectedByUserId: string
}

/** One row per workspace - a client re-selecting a spreadsheet replaces
 * their prior choice rather than accumulating history, since only the
 * current selection is ever meaningful for sync. */
export async function saveGoogleSheetsSelection(input: SaveGoogleSheetsSelectionInput): Promise<GoogleSheetsSelection> {
  return withDb(async (db) => {
    const existing = await db
      .select({ id: googleSheetsSelections.id })
      .from(googleSheetsSelections)
      .where(eq(googleSheetsSelections.workspaceId, input.workspaceId))
      .limit(1)

    const values = {
      spreadsheetId: input.spreadsheetId,
      spreadsheetName: input.spreadsheetName ?? null,
      worksheetName: input.worksheetName,
      columnMapping: input.columnMapping ?? {},
      selectedByUserId: input.selectedByUserId,
      updatedAt: new Date(),
    }

    if (existing[0]) {
      const [row] = await db
        .update(googleSheetsSelections)
        .set(values)
        .where(eq(googleSheetsSelections.workspaceId, input.workspaceId))
        .returning()
      return rowToSelection(row)
    }

    const [row] = await db
      .insert(googleSheetsSelections)
      .values({ id: randomUUID(), workspaceId: input.workspaceId, ...values })
      .returning()
    return rowToSelection(row)
  })
}

export async function deleteGoogleSheetsSelection(workspaceId: string): Promise<void> {
  await withDb(async (db) => {
    await db.delete(googleSheetsSelections).where(eq(googleSheetsSelections.workspaceId, workspaceId))
  })
}
