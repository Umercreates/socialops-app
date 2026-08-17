"use client"

import * as React from "react"
import { Loader2, CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatRelativeTime } from "@/lib/format"

interface Spreadsheet {
  id: string
  name: string
}
interface Worksheet {
  title: string
}
interface Selection {
  spreadsheetId: string
  spreadsheetName: string | null
  worksheetName: string
}
interface SyncSummary {
  lastSyncedAt: string | null
  totalSynced: number
  lastError: string | null
}

type Step = "loading" | "view" | "pick-spreadsheet" | "pick-worksheet"

/** Which spreadsheet/worksheet this workspace's CRM data mirrors to - the
 * whole point is a client picks this from the dashboard, never by editing
 * GOOGLE_SHEET_ID or any other env var. */
export function GoogleSheetsPicker({ canManage }: { canManage: boolean }) {
  const [step, setStep] = React.useState<Step>("loading")
  const [selection, setSelection] = React.useState<Selection | null>(null)
  const [summary, setSummary] = React.useState<SyncSummary | null>(null)
  const [spreadsheets, setSpreadsheets] = React.useState<Spreadsheet[] | null>(null)
  const [worksheets, setWorksheets] = React.useState<Worksheet[] | null>(null)
  const [chosenSpreadsheet, setChosenSpreadsheet] = React.useState<Spreadsheet | null>(null)
  const [chosenWorksheet, setChosenWorksheet] = React.useState<string>("")
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      setStep("loading")
      setError(null)
      const [selRes, summaryRes] = await Promise.all([
        fetch("/api/integrations/google-sheets/selection", { credentials: "same-origin" }),
        fetch("/api/integrations/google-sheets/sync-summary", { credentials: "same-origin" }),
      ])
      const selData = await selRes.json().catch(() => null)
      const summaryData = await summaryRes.json().catch(() => null)
      if (cancelled) return
      setSummary(summaryData?.summary ?? null)
      if (selData?.selection) {
        setSelection(selData.selection)
        setStep("view")
      } else {
        setSelection(null)
        startPicking()
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function startPicking() {
    setStep("pick-spreadsheet")
    setError(null)
    setSpreadsheets(null)
    const res = await fetch("/api/integrations/google-sheets/spreadsheets", { credentials: "same-origin" })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setError(data?.error ?? "Couldn't load spreadsheets.")
      return
    }
    setSpreadsheets(data.spreadsheets ?? [])
  }

  async function pickSpreadsheet(sheet: Spreadsheet) {
    setChosenSpreadsheet(sheet)
    setStep("pick-worksheet")
    setError(null)
    setWorksheets(null)
    const res = await fetch(`/api/integrations/google-sheets/spreadsheets/${encodeURIComponent(sheet.id)}/worksheets`, { credentials: "same-origin" })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      setError(data?.error ?? "Couldn't load worksheets.")
      return
    }
    setWorksheets(data.worksheets ?? [])
    if (data.worksheets?.[0]) setChosenWorksheet(data.worksheets[0].title)
  }

  async function saveSelection() {
    if (!chosenSpreadsheet || !chosenWorksheet) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/integrations/google-sheets/selection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ spreadsheetId: chosenSpreadsheet.id, spreadsheetName: chosenSpreadsheet.name, worksheetName: chosenWorksheet }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to save selection.")
        return
      }
      setSelection(data.selection)
      setStep("view")
    } catch {
      setError("Couldn't reach the server.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Spreadsheet</Label>

      {step === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      )}

      {step === "view" && selection && (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Spreadsheet</span>
            <span className="font-medium text-foreground">{selection.spreadsheetName ?? selection.spreadsheetId}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Worksheet</span>
            <span className="font-medium text-foreground">{selection.worksheetName}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Last sync</span>
            <span className="font-medium text-foreground">
              {summary?.lastSyncedAt ? formatRelativeTime(summary.lastSyncedAt, new Date()) : "Never synced yet"}
              {summary && summary.totalSynced > 0 ? ` · ${summary.totalSynced} lead${summary.totalSynced === 1 ? "" : "s"} synced` : ""}
            </span>
            {summary?.lastError && <span className="text-xs text-destructive">{summary.lastError}</span>}
          </div>
          {canManage && (
            <Button type="button" size="sm" variant="outline" className="mt-1 w-fit" onClick={startPicking}>
              Change selection
            </Button>
          )}
        </div>
      )}

      {step === "pick-spreadsheet" && (
        <>
          {error ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : !spreadsheets ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Discovering spreadsheets...
            </div>
          ) : spreadsheets.length === 0 ? (
            <p className="text-xs text-muted-foreground">No spreadsheets found in this Google account.</p>
          ) : (
            <Select value="" onValueChange={(id) => id && pickSpreadsheet(spreadsheets.find((s) => s.id === id)!)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a spreadsheet" />
              </SelectTrigger>
              <SelectContent>
                {spreadsheets.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </>
      )}

      {step === "pick-worksheet" && (
        <>
          <p className="text-xs text-muted-foreground">{chosenSpreadsheet?.name}</p>
          {error ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : !worksheets ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Discovering worksheets...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Select value={chosenWorksheet} onValueChange={(v) => v && setChosenWorksheet(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a worksheet" />
                </SelectTrigger>
                <SelectContent>
                  {worksheets.map((w) => (
                    <SelectItem key={w.title} value={w.title}>
                      {w.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={saveSelection} disabled={!chosenWorksheet || saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
