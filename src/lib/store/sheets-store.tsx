"use client"

import * as React from "react"
import type { Call, GoogleSheetSync, Lead, Meeting } from "@/types"
import { simulateSyncLeadToSheet, simulateTestConnection, type LeadSheetRow } from "@/lib/integrations/sheets"
import { nowIso } from "@/lib/data/constants"
import { useDemoMode } from "@/lib/demo-mode-context"
import { useProviderStatus } from "@/lib/hooks/use-provider-status"

interface SyncRecord {
  leadId: string
  syncedAt: string
  row: LeadSheetRow
}

interface SheetsContextValue {
  records: SyncRecord[]
  setRecords: React.Dispatch<React.SetStateAction<SyncRecord[]>>
}

const SheetsContext = React.createContext<SheetsContextValue | null>(null)

export function SheetsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = React.useState<SyncRecord[]>([])
  const value = React.useMemo(() => ({ records, setRecords }), [records])
  return <SheetsContext.Provider value={value}>{children}</SheetsContext.Provider>
}

/**
 * Google Sheets sync state. In demo mode this stays a clearly-labeled local
 * simulation (see integration status). Outside demo mode, status reflects
 * the workspace's real google-sheets connection (never "connected" just
 * because DEMO_MODE=false), and there is no real spreadsheet-write adapter
 * yet - syncLead/testConnection both report an honest blocked/not-yet-
 * implemented result instead of pretending a row was written.
 */
export function useGoogleSheets() {
  const ctx = React.useContext(SheetsContext)
  if (!ctx) throw new Error("useGoogleSheets must be used within SheetsProvider")
  const { records, setRecords } = ctx

  const demoMode = useDemoMode()
  const { view, isLive } = useProviderStatus("google-sheets")
  const lastSyncAt = records.length > 0 ? records[records.length - 1].syncedAt : null

  const status: GoogleSheetSync = demoMode
    ? { status: "not-connected", sheetUrl: undefined, lastSyncAt, rowsAdded: records.length, errors: 0 }
    : { status: isLive ? "connected" : "not-connected", sheetUrl: undefined, lastSyncAt, rowsAdded: 0, errors: 0 }

  const syncLead = React.useCallback(
    async (lead: Lead, latestCall?: Call, meeting?: Meeting) => {
      if (!demoMode) {
        if (!isLive) {
          return { ok: false, row: undefined, message: "Google Sheets isn't connected for this workspace - connect it in Integrations." }
        }
        try {
          const res = await fetch(`/api/leads/${lead.id}/sync-sheet`, { method: "POST", credentials: "same-origin" })
          const data = await res.json()
          return { ok: Boolean(data.ok), row: undefined, message: data.message ?? (data.ok ? "Synced." : "Sync failed.") }
        } catch {
          return { ok: false, row: undefined, message: "Couldn't reach the server." }
        }
      }
      const result = await simulateSyncLeadToSheet(lead, latestCall, meeting)
      setRecords((prev) => [...prev, { leadId: lead.id, syncedAt: nowIso(), row: result.row }])
      return result
    },
    [demoMode, isLive, setRecords]
  )

  const testConnection = React.useCallback(() => {
    if (!demoMode) {
      return Promise.resolve({
        ok: isLive,
        message: isLive ? "Google Sheets connection is active." : view?.readiness.missing.join(", ") || "Google Sheets isn't connected.",
      })
    }
    return simulateTestConnection()
  }, [demoMode, isLive, view])

  const lastSyncFor = React.useCallback(
    (leadId: string) => {
      const forLead = records.filter((r) => r.leadId === leadId)
      return forLead.length > 0 ? forLead[forLead.length - 1] : undefined
    },
    [records]
  )

  return { status, records, syncLead, testConnection, lastSyncFor }
}
