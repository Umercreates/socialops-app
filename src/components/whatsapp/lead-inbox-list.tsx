"use client"

import * as React from "react"
import { PhoneCall, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { LeadScoreBadge } from "@/components/leads/lead-score-badge"
import { LeadProfileDrawer } from "@/components/leads/lead-profile-drawer"
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/lead-status"
import { formatRelativeTime } from "@/lib/format"
import { MOCK_NOW } from "@/lib/data/constants"
import { TEAM_MEMBERS } from "@/lib/data/settings"
import { useLeads } from "@/lib/store/leads-store"

export function LeadInboxList() {
  const { leads } = useLeads()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const selected = leads.find((l) => l.id === selectedId) ?? null

  const waLeads = leads
    .filter((lead) => lead.whatsappNumber)
    .sort((a, b) => b.lastInteractionAt.localeCompare(a.lastInteractionAt))

  return (
    <Card className="gap-3 px-5 py-5">
      <CardHeader className="px-0">
        <CardTitle className="text-[15px]">WhatsApp lead inbox</CardTitle>
        <p className="text-xs text-muted-foreground">Every lead that has moved into WhatsApp, with source attribution preserved.</p>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border px-0">
        {waLeads.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No WhatsApp leads yet.</p>}
        {waLeads.map((lead) => {
          const assignee = TEAM_MEMBERS.find((m) => m.id === lead.assignedTo)
          return (
            <button
              key={lead.id}
              type="button"
              onClick={() => setSelectedId(lead.id)}
              className="flex flex-wrap items-center gap-3 py-3 text-left transition-colors hover:bg-muted/40"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                {lead.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{lead.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {lead.whatsappNumber} · {lead.source.campaign ?? lead.source.platform}
                </span>
              </div>
              <LeadScoreBadge score={lead.score} className="hidden sm:inline-flex" />
              <StatusBadge tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABEL[lead.status]}</StatusBadge>
              <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                {lead.callStatus && (
                  <span className="flex items-center gap-1">
                    <PhoneCall className="size-3" />
                    {lead.callStatus}
                  </span>
                )}
                {lead.meetingStatus && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {lead.meetingStatus}
                  </span>
                )}
              </div>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{assignee ? assignee.name.split(" ")[0] : "Unassigned"}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(lead.lastInteractionAt, MOCK_NOW)}</span>
            </button>
          )
        })}
      </CardContent>
      <LeadProfileDrawer lead={selected} onOpenChange={(open) => !open && setSelectedId(null)} />
    </Card>
  )
}
