"use client"

import * as React from "react"
import type { Call, GoogleSheetSync, Lead, Meeting } from "@/types"
import { getSheetsIntegrationStatus, simulateSyncLeadToSheet, simulateTestConnection, type LeadSheetRow } from "@/lib/integrations/sheets"
import { nowIso } from "@/lib/data/constants"

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

/** Google Sheets sync state — `status`/`rowsAdded` mirror what a real
 * Sheets-connected workspace would show; everything here stays local to
 * this demo session and is clearly a simulation (see integration status). */
export function useGoogleSheets() {
  const ctx = React.useContext(SheetsContext)
  if (!ctx) throw new Error("useGoogleSheets must be used within SheetsProvider")
  const { records, setRecords } = ctx

  const integration = getSheetsIntegrationStatus()
  const lastSyncAt = records.length > 0 ? records[records.length - 1].syncedAt : null

  const status: GoogleSheetSync = {
    ...integration,
    lastSyncAt,
    rowsAdded: records.length,
  }

  const syncLead = React.useCallback(
    async (lead: Lead, latestCall?: Call, meeting?: Meeting) => {
      const result = await simulateSyncLeadToSheet(lead, latestCall, meeting)
      setRecords((prev) => [...prev, { leadId: lead.id, syncedAt: nowIso(), row: result.row }])
      return result
    },
    [setRecords]
  )

  const testConnection = React.useCallback(() => simulateTestConnection(), [])

  const lastSyncFor = React.useCallback(
    (leadId: string) => {
      const forLead = records.filter((r) => r.leadId === leadId)
      return forLead.length > 0 ? forLead[forLead.length - 1] : undefined
    },
    [records]
  )

  return { status, records, syncLead, testConnection, lastSyncFor }
}
