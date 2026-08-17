"use client"

import * as React from "react"
import { FileSpreadsheet, Loader2, CircleAlert, RefreshCw, Table2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { RealSettingsPointer } from "@/components/settings/real-settings-pointer"
import { LEAD_SHEET_COLUMNS } from "@/lib/integrations/sheets"
import { formatRelativeTime } from "@/lib/format"
import { MOCK_NOW } from "@/lib/data/constants"
import { useDemoMode } from "@/lib/demo-mode-context"
import { useGoogleSheets } from "@/lib/store/sheets-store"

export function SheetsSettings() {
  const demoMode = useDemoMode()
  const { status, records, testConnection } = useGoogleSheets()
  const [testing, setTesting] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{ ok: boolean; message: string } | null>(null)

  if (!demoMode) {
    return (
      <RealSettingsPointer
        icon={FileSpreadsheet}
        title="Google Sheets sync"
        description="Connect Google Sheets, pick a spreadsheet, and map lead columns from the dedicated Integrations page."
        href="/dashboard/integrations"
        cta="Go to Integrations"
      />
    )
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    const result = await testConnection()
    setTestResult(result)
    setTesting(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="gap-4 px-5 py-5">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-1.5 text-[15px]">
            <FileSpreadsheet className="size-4" />
            Google Sheets sync
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Every WhatsApp-qualified lead and completed call can be exported to a Google Sheet — a free, simple backup your team already knows how to use.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Connection status</span>
              <span className="text-xs text-muted-foreground">
                {status.status === "connected" ? "Connected to a live Google Sheet." : "Not connected — a real integration needs a Google Cloud project, the Sheets API, and OAuth/service-account credentials."}
              </span>
            </div>
            <StatusBadge tone={status.status === "connected" ? "success" : "neutral"}>{status.status === "connected" ? "Connected" : "Not connected"}</StatusBadge>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-3.5 text-sm sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Rows added (demo)</span>
              <span className="font-medium text-foreground">{status.rowsAdded}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Last sync</span>
              <span className="font-medium text-foreground">{status.lastSyncAt ? formatRelativeTime(status.lastSyncAt, MOCK_NOW) : "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Errors</span>
              <span className="font-medium text-foreground">{status.errors}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3.5">
            <Button size="sm" variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Test connection
            </Button>
          </div>

          {testResult && (
            <p className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning-foreground dark:text-warning">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
              {testResult.message}
            </p>
          )}

          <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Rows currently sync locally in this demo session only — nothing is sent to a real spreadsheet until Google credentials are connected.
          </p>
        </CardContent>
      </Card>

      <Card className="gap-4 px-5 py-5">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-1.5 text-[15px]">
            <Table2 className="size-4" />
            Sheet columns
          </CardTitle>
          <p className="text-xs text-muted-foreground">Every synced row includes these {LEAD_SHEET_COLUMNS.length} fields.</p>
        </CardHeader>
        <CardContent className="px-0">
          <div className="flex flex-wrap gap-1.5">
            {LEAD_SHEET_COLUMNS.map((col) => (
              <span key={col} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                {col}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {records.length > 0 && (
        <Card className="gap-3 px-5 py-5">
          <CardHeader className="px-0">
            <CardTitle className="text-[15px]">Recent syncs (simulated)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border px-0">
            {records
              .slice(-5)
              .reverse()
              .map((record) => (
                <div key={`${record.leadId}-${record.syncedAt}`} className="flex items-center justify-between py-2 text-xs">
                  <span className="text-foreground">{record.row.Name || "Unnamed lead"}</span>
                  <span className="text-muted-foreground">{formatRelativeTime(record.syncedAt, MOCK_NOW)}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
