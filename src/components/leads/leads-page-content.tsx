"use client"

import * as React from "react"
import { LayoutGrid, List, Search, Loader2, CircleAlert, RotateCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LeadsKanban } from "@/components/leads/leads-kanban"
import { LeadsTable } from "@/components/leads/leads-table"
import { LEAD_STATUS_LABEL } from "@/lib/lead-status"
import { useLeads } from "@/lib/store/leads-store"
import type { LeadIntentStatus } from "@/types"
import { cn } from "@/lib/utils"

type View = "kanban" | "table"
type StatusFilter = "all" | LeadIntentStatus

export function LeadsPageContent() {
  const { leads, isLoading, error, refetch } = useLeads()
  const [view, setView] = React.useState<View>("kanban")
  const [query, setQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")

  const filtered = leads
    .filter((lead) => statusFilter === "all" || lead.status === statusFilter)
    .filter((lead) => {
      if (!query.trim()) return true
      const q = query.trim().toLowerCase()
      return lead.name.toLowerCase().includes(q) || lead.whatsappNumber?.toLowerCase().includes(q) || lead.company?.toLowerCase().includes(q)
    })
    .sort((a, b) => b.lastInteractionAt.localeCompare(a.lastInteractionAt))

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Leads / CRM</h2>
        <p className="text-sm text-muted-foreground">Every lead from first touch to closed deal, with the full WhatsApp and call history attached.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              view === "kanban" ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-3.5" />
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              view === "table" ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-3.5" />
            Table
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search leads…"
            className="h-8 w-48 pl-8"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(LEAD_STATUS_LABEL) as LeadIntentStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {LEAD_STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} leads</span>
      </div>

      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription className="flex flex-1 items-center justify-between gap-3">
            {error}
            <Button type="button" variant="outline" size="xs" onClick={refetch}>
              <RotateCw />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && leads.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading leads…
        </div>
      ) : view === "kanban" ? (
        <LeadsKanban leads={filtered} />
      ) : (
        <LeadsTable leads={filtered} />
      )}
    </div>
  )
}
