"use client"

import * as React from "react"
import { Loader2, CircleAlert, CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatRelativeTime } from "@/lib/format"
import { SHEET_FIELD_KEYS, SHEET_FIELD_LABELS, DEFAULT_COLUMN_MAPPING, REQUIRED_SHEET_FIELDS } from "@/lib/integrations/google-sheets/fields"

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
  columnMapping: Record<string, string>
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

      {step === "view" && selection && (
        <ColumnMappingEditor selection={selection} canManage={canManage} onSaved={setSelection} />
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

const COLUMN_LETTER_PATTERN = /^[A-Za-z]{1,2}$/

/** Which spreadsheet column each EasyLife field lands in - an empty saved
 * mapping means "use the sensible defaults" (see fields.ts); clearing a
 * field here and saving disables it (that column is simply never
 * written), which is why REQUIRED_SHEET_FIELDS can't be cleared. */
function ColumnMappingEditor({ selection, canManage, onSaved }: { selection: Selection; canManage: boolean; onSaved: (selection: Selection) => void }) {
  const initial = Object.keys(selection.columnMapping).length > 0 ? selection.columnMapping : DEFAULT_COLUMN_MAPPING
  const [mapping, setMapping] = React.useState<Record<string, string>>(initial)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

  function setField(key: string, value: string) {
    setSaved(false)
    setMapping((prev) => ({ ...prev, [key]: value.toUpperCase() }))
  }

  function resetToDefaults() {
    setSaved(false)
    setError(null)
    setMapping({ ...DEFAULT_COLUMN_MAPPING })
  }

  async function save() {
    setError(null)
    for (const key of REQUIRED_SHEET_FIELDS) {
      if (!mapping[key]?.trim()) {
        setError(`${SHEET_FIELD_LABELS[key]} is required and can't be disabled.`)
        return
      }
    }
    for (const [key, value] of Object.entries(mapping)) {
      if (value.trim() && !COLUMN_LETTER_PATTERN.test(value.trim())) {
        setError(`"${value}" for ${SHEET_FIELD_LABELS[key as keyof typeof SHEET_FIELD_LABELS] ?? key} isn't a valid column letter (e.g. A, B, AA).`)
        return
      }
    }

    const cleaned = Object.fromEntries(Object.entries(mapping).filter(([, v]) => v.trim().length > 0))

    setSaving(true)
    try {
      const res = await fetch("/api/integrations/google-sheets/selection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          spreadsheetId: selection.spreadsheetId,
          spreadsheetName: selection.spreadsheetName ?? undefined,
          worksheetName: selection.worksheetName,
          columnMapping: cleaned,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to save field mapping.")
        return
      }
      onSaved(data.selection)
      setSaved(true)
    } catch {
      setError("Couldn't reach the server.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Field mapping</span>
        {canManage && (
          <Button type="button" size="sm" variant="ghost" onClick={resetToDefaults}>
            Reset to defaults
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Which spreadsheet column each field writes to. Clear a field to skip writing it.
      </p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {SHEET_FIELD_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <Label htmlFor={`sheet-field-${key}`} className="text-xs text-muted-foreground">
              {SHEET_FIELD_LABELS[key]}
              {REQUIRED_SHEET_FIELDS.includes(key) && <span className="text-destructive"> *</span>}
            </Label>
            {canManage ? (
              <Input
                id={`sheet-field-${key}`}
                value={mapping[key] ?? ""}
                onChange={(e) => setField(key, e.target.value)}
                placeholder="—"
                maxLength={2}
                className="h-8 text-sm"
              />
            ) : (
              <span className="text-sm text-foreground">{mapping[key] || "—"}</span>
            )}
          </div>
        ))}
      </div>
      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {canManage && (
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={save} disabled={saving} className="w-fit">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save mapping
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-success">
              <CircleCheck className="size-3.5" />
              Saved.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
