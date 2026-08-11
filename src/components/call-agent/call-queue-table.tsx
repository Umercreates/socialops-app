"use client"

import * as React from "react"
import { Phone, CalendarClock, SkipForward, User, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LeadScoreBadge } from "@/components/leads/lead-score-badge"
import { LeadProfileDrawer } from "@/components/leads/lead-profile-drawer"
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { CALL_STATUS_LABEL, CALL_STATUS_TONE, CALL_PERMISSION_LABEL } from "@/lib/lead-status"
import { buildClickToChatLink } from "@/lib/integrations/whatsapp"
import { useLeads } from "@/lib/store/leads-store"
import { useCallQueue } from "@/lib/store/calls-store"
import type { CallQueueItem, Lead, SocialPlatform } from "@/types"

const SOCIAL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "youtube", "x"]
function isSocialPlatform(platform: Lead["source"]["platform"]): platform is SocialPlatform {
  return (SOCIAL_PLATFORMS as string[]).includes(platform)
}

export function CallQueueTable({ onCallNow }: { onCallNow: (lead: Lead) => void }) {
  const { leads } = useLeads()
  const { queue, schedule, removeFromQueue } = useCallQueue()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const selected = leads.find((l) => l.id === selectedId) ?? null
  const [schedulingId, setSchedulingId] = React.useState<string | null>(null)
  const [scheduleValue, setScheduleValue] = React.useState("")

  const rows = queue
    .map((item) => ({ item, lead: leads.find((l) => l.id === item.leadId) }))
    .filter((r): r is { item: CallQueueItem; lead: Lead } => Boolean(r.lead))
    .sort((a, b) => b.lead.score - a.lead.score)

  function confirmSchedule(item: CallQueueItem) {
    if (!scheduleValue) return
    schedule(item.id, new Date(scheduleValue).toISOString())
    setSchedulingId(null)
    setScheduleValue("")
  }

  if (rows.length === 0) {
    return <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">No leads in the call queue yet — queue one from the Leads page or WhatsApp inbox.</div>
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-3.5 py-2.5 font-medium">Lead</th>
            <th className="px-3.5 py-2.5 font-medium">Source</th>
            <th className="px-3.5 py-2.5 font-medium">Score</th>
            <th className="px-3.5 py-2.5 font-medium">Service</th>
            <th className="px-3.5 py-2.5 font-medium">Call permission</th>
            <th className="px-3.5 py-2.5 font-medium">Preferred time</th>
            <th className="px-3.5 py-2.5 font-medium">Status</th>
            <th className="px-3.5 py-2.5 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(({ item, lead }) => {
            const canCall = lead.callPermission !== "no"
            const waLink = lead.whatsappNumber ? buildClickToChatLink(lead.whatsappNumber, `Hi ${lead.name.split(" ")[0]}, following up on your inquiry.`) : null
            return (
              <React.Fragment key={item.id}>
                <tr className="align-top">
                  <td className="px-3.5 py-2.5">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{lead.name}</span>
                      <span className="text-xs text-muted-foreground">{lead.whatsappNumber ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {isSocialPlatform(lead.source.platform) && <PlatformIcon platform={lead.source.platform} size={12} />}
                      {isSocialPlatform(lead.source.platform) ? PLATFORM_LABEL[lead.source.platform] : lead.source.platform}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <LeadScoreBadge score={lead.score} />
                  </td>
                  <td className="px-3.5 py-2.5 text-xs text-foreground">{lead.qualification.serviceInterested ?? "—"}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="flex items-center gap-1 text-xs text-foreground">
                      {!canCall && <ShieldAlert className="size-3 text-destructive" />}
                      {CALL_PERMISSION_LABEL[lead.callPermission]}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-xs text-muted-foreground">{item.scheduledFor ? new Date(item.scheduledFor).toLocaleString() : item.preferredTime ?? "—"}</td>
                  <td className="px-3.5 py-2.5">
                    <StatusBadge tone={CALL_STATUS_TONE[item.status]}>{CALL_STATUS_LABEL[item.status]}</StatusBadge>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <div className="flex flex-wrap items-center gap-1">
                      <Button size="sm" variant="outline" disabled={!canCall} title={!canCall ? "Call permission not granted" : undefined} onClick={() => onCallNow(lead)}>
                        <Phone className="size-3.5" />
                        Call now
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSchedulingId(schedulingId === item.id ? null : item.id)}>
                        <CalendarClock className="size-3.5" />
                        Schedule
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeFromQueue(item.id)}>
                        <SkipForward className="size-3.5" />
                        Skip
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedId(lead.id)}>
                        <User className="size-3.5" />
                        Lead
                      </Button>
                      {waLink && (
                        <Button render={<a href={waLink} target="_blank" rel="noopener noreferrer" />} nativeButton={false} size="sm" variant="ghost">
                          <WhatsAppIcon size={13} />
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                {schedulingId === item.id && (
                  <tr>
                    <td colSpan={8} className="bg-muted/40 px-3.5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="datetime-local"
                          value={scheduleValue}
                          onChange={(event) => setScheduleValue(event.target.value)}
                          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                        />
                        <Button size="sm" onClick={() => confirmSchedule(item)} disabled={!scheduleValue}>
                          Confirm
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSchedulingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
      <LeadProfileDrawer lead={selected} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  )
}
