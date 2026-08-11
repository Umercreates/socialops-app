"use client"

import * as React from "react"
import { ShieldCheck, PhoneCall } from "lucide-react"
import { CallQueueTable } from "@/components/call-agent/call-queue-table"
import { LiveCallDialog } from "@/components/call-agent/live-call-dialog"
import { LeadProfileDrawer } from "@/components/leads/lead-profile-drawer"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { CALL_STATUS_LABEL, CALL_STATUS_TONE } from "@/lib/lead-status"
import { formatRelativeTime } from "@/lib/format"
import { MOCK_NOW } from "@/lib/data/constants"
import { useCalls } from "@/lib/store/calls-store"
import { useLeads } from "@/lib/store/leads-store"
import type { Lead } from "@/types"

export function CallAgentPageContent() {
  const { calls } = useCalls()
  const { leads } = useLeads()
  const [activeLead, setActiveLead] = React.useState<Lead | null>(null)
  const [reviewLeadId, setReviewLeadId] = React.useState<string | null>(null)
  const reviewLead = leads.find((l) => l.id === reviewLeadId) ?? null

  const completedCalls = calls.filter((c) => c.endedAt).sort((a, b) => (b.endedAt ?? "").localeCompare(a.endedAt ?? ""))

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
          <PhoneCall className="size-5" />
          Call Agent
        </h2>
        <p className="text-sm text-muted-foreground">AI call agent for Interested, Qualified, and Hot leads — every call is started by a team member.</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border px-3.5 py-3 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-brand" />
        <p>
          <span className="font-medium text-foreground">Manual Approval mode.</span> The AI never dials on its own — a team member starts each call from
          this queue, and leads with call permission set to “No” can&apos;t be called. Auto-call and scheduled-call modes are configurable in Settings.
        </p>
      </div>

      <CallQueueTable onCallNow={setActiveLead} />

      {completedCalls.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-medium text-foreground">Recent calls</span>
          <div className="flex flex-col divide-y divide-border rounded-xl bg-card ring-1 ring-foreground/10">
            {completedCalls.map((call) => {
              const lead = leads.find((l) => l.id === call.leadId)
              if (!lead) return null
              return (
                <button
                  key={call.id}
                  type="button"
                  onClick={() => setReviewLeadId(lead.id)}
                  className="flex flex-wrap items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">{lead.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{call.summary?.recommendedNextAction ?? "No summary"}</span>
                  </div>
                  <StatusBadge tone={CALL_STATUS_TONE[call.status]}>{CALL_STATUS_LABEL[call.status]}</StatusBadge>
                  <span className="shrink-0 text-xs text-muted-foreground">{call.durationSeconds ? `${Math.round(call.durationSeconds / 60)} min` : "—"}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{call.endedAt && formatRelativeTime(call.endedAt, MOCK_NOW)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <LiveCallDialog lead={activeLead} onOpenChange={(open) => !open && setActiveLead(null)} />
      <LeadProfileDrawer lead={reviewLead} onOpenChange={(open) => !open && setReviewLeadId(null)} />
    </div>
  )
}
