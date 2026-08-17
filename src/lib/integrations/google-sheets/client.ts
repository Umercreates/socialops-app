/**
 * Google Drive/Sheets REST client for spreadsheet discovery - real API
 * calls against the workspace's own OAuth access token, matching the
 * documented endpoints:
 * https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list
 * https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/get
 *
 * Same never-throws contract as every other provider adapter in this
 * codebase: every failure resolves to `{ok: false, error}` with a safe
 * message, never a raw upstream error or a stack trace.
 */

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files"
const SHEETS_BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets"

export interface SpreadsheetSummary {
  id: string
  name: string
}

export interface ListSpreadsheetsResult {
  ok: boolean
  spreadsheets?: SpreadsheetSummary[]
  error?: string
}

/** Lists spreadsheets visible to the connected Google account - the
 * client picks from this instead of pasting a spreadsheet ID by hand. */
export async function listSpreadsheets(accessToken: string): Promise<ListSpreadsheetsResult> {
  try {
    const url = new URL(DRIVE_FILES_URL)
    url.searchParams.set("q", "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false")
    url.searchParams.set("fields", "files(id,name)")
    url.searchParams.set("pageSize", "100")

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    })
    const json = await res.json().catch(() => null)

    if (res.status === 401) return { ok: false, error: "Google authorization has expired - reconnect Google in Integrations." }
    if (!res.ok) return { ok: false, error: json?.error?.message ?? `Google Drive API returned ${res.status}` }

    const files = Array.isArray(json?.files) ? json.files : []
    return { ok: true, spreadsheets: files.map((f: { id: string; name: string }) => ({ id: f.id, name: f.name })) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't reach the Google Drive API." }
  }
}

export interface WorksheetSummary {
  title: string
}

export interface ListWorksheetsResult {
  ok: boolean
  spreadsheetName?: string
  worksheets?: WorksheetSummary[]
  error?: string
}

/** Lists the worksheet tabs inside one specific spreadsheet, once a
 * client has picked which spreadsheet to use. */
export async function listWorksheets(accessToken: string, spreadsheetId: string): Promise<ListWorksheetsResult> {
  try {
    const url = new URL(`${SHEETS_BASE_URL}/${encodeURIComponent(spreadsheetId)}`)
    url.searchParams.set("fields", "properties.title,sheets.properties.title")

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    })
    const json = await res.json().catch(() => null)

    if (res.status === 401) return { ok: false, error: "Google authorization has expired - reconnect Google in Integrations." }
    if (res.status === 404) return { ok: false, error: "That spreadsheet isn't accessible with this Google account anymore." }
    if (!res.ok) return { ok: false, error: json?.error?.message ?? `Google Sheets API returned ${res.status}` }

    const sheets = Array.isArray(json?.sheets) ? json.sheets : []
    return {
      ok: true,
      spreadsheetName: json?.properties?.title,
      worksheets: sheets.map((s: { properties?: { title?: string } }) => ({ title: s.properties?.title ?? "" })).filter((w: WorksheetSummary) => w.title),
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't reach the Google Sheets API." }
  }
}
