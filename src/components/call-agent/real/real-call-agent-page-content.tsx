"use client"

import * as React from "react"
import { Phone, User, ShieldAlert, PhoneCall, ShieldCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LeadScoreBadge } from "@/components/leads/lead-score-badge"
import { LeadProfileDrawer } from "@/components/leads/lead-profile-drawer"
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { RealCallReviewDialog } from "@/components/call-agent/real/real-call-review-dialog"
import { CALL_STATUS_LABEL, CALL_STATUS_TONE, CALL_PERMISSION_LABEL } from "@/lib/lead-status"
import { buildClickToChatLink } from "@/lib/integrations/whatsapp"
import { formatRelativeTime } from "@/lib/format"
import { useLeads } from "@/lib/store/leads-store"
import type { Call, Lead, SocialPlatform } from "@/types"

const SOCIAL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "youtube", "x"]
function isSocialPlatform(platform: Lead["source"]["platform"]): platform is SocialPlatform {
  return (SOCIAL_PLATFORMS as string[]).includes(platform)
}

const CALLABLE_STAGES = new Set(["new", "social-dm", "whatsapp-started", "qualifying", "interested", "qualified", "call-scheduled", "called", "ready-for-sales", "human-followup"])

export function RealCallAgentPageContent() {
  const { leads } = useLeads()
  const [calls, setCalls] = React.useState<Call[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dispatchingId, setDispatchingId] = React.useState<string | null>(null)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(null)
  const [reviewCallId, setReviewCallId] = React.useState<string | null>(null)

  const selected = leads.find((l) => l.id === selectedLeadId) ?? null
  const reviewCall = calls.find((c) => c.id === reviewCallId) ?? null
  const reviewLead = reviewCall ? leads.find((l) => l.id === reviewCall.leadId) ?? null : null

  const refreshCalls = React.useCallback(async () => {
    try {
      const res = await fetch("/api/calls", { credentials: "same-origin" })
      if (!res.ok) return
      const data = await res.json()
      setCalls(data.calls)
    } catch {
      // Recent calls list just stays whatever it was - not fatal.
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      await refreshCalls()
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [refreshCalls])

  const callableLeads = leads.filter((l) => CALLABLE_STAGES.has(l.stage)).sort((a, b) => b.score - a.score)
  const RECENT_STATUSES = new Set(["completed", "failed", "blocked"])
  const completedCalls = [...calls]
    .filter((c) => RECENT_STATUSES.has(c.status))
    .sort((a, b) => (b.endedAt ?? "").localeCompare(a.endedAt ?? ""))

  async function callNow(lead: Lead) {
    setDispatchingId(lead.id)
    setStatusMessage(null)
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ leadId: lead.id }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setStatusMessage(data?.error ?? "Couldn't queue this call.")
        return
      }
      if (data.blocked) {
        setStatusMessage(`${lead.name}: ${data.call?.blockReason ?? "Call was blocked."}`)
      } else {
        setStatusMessage(`Call to ${lead.name} queued.`)
      }
      await refreshCalls()
    } catch {
      setStatusMessage("Couldn't reach the server.")
    } finally {
      setDispatchingId(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
          <PhoneCall className="size-5" />
          Call Agent
        </h2>
        <p className="text-sm text-muted-foreground">AI call agent for your leads — every call is started by a team member.</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-border px-3.5 py-3 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-brand" />
        <p>
          <span className="font-medium text-foreground">Manual approval mode.</span> The AI never dials on its own — a team member starts each call
          from this list, and leads with call permission set to &quot;No&quot; can&apos;t be called.
        </p>
      </div>

      {statusMessage && (
        <div className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-xs text-foreground">{statusMessage}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : callableLeads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          No leads to call yet — leads appear here once they come in from Leads or WhatsApp.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10">
          <table className="w-full min-w-220 border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-3.5 py-2.5 font-medium">Lead</th>
                <th className="px-3.5 py-2.5 font-medium">Source</th>
                <th className="px-3.5 py-2.5 font-medium">Score</th>
                <th className="px-3.5 py-2.5 font-medium">Service</th>
                <th className="px-3.5 py-2.5 font-medium">Call permission</th>
                <th className="px-3.5 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {callableLeads.map((lead) => {
                const canCall = lead.callPermission === "yes"
                const waLink = lead.whatsappNumber ? buildClickToChatLink(lead.whatsappNumber, `Hi ${lead.name.split(" ")[0]}, following up on your inquiry.`) : null
                return (
                  <tr key={lead.id} className="align-top">
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
                    <td className="px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canCall || dispatchingId === lead.id}
                          title={!canCall ? "Call permission not granted" : undefined}
                          onClick={() => callNow(lead)}
                        >
                          {dispatchingId === lead.id ? <Loader2 className="size-3.5 animate-spin" /> : <Phone className="size-3.5" />}
                          Call now
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedLeadId(lead.id)}>
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {completedCalls.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-medium text-foreground">Recent calls</span>
          <div className="flex flex-col divide-y divide-border rounded-xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10">
            {completedCalls.map((call) => {
              const lead = leads.find((l) => l.id === call.leadId)
              return (
                <button
                  key={call.id}
                  type="button"
                  onClick={() => setReviewCallId(call.id)}
                  className="flex flex-wrap items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">{lead?.name ?? "Unknown lead"}</span>
                    <span className="truncate text-xs text-muted-foreground">{call.summary?.recommendedNextAction ?? "No summary"}</span>
                  </div>
                  <StatusBadge tone={CALL_STATUS_TONE[call.status]}>{CALL_STATUS_LABEL[call.status]}</StatusBadge>
                  <span className="shrink-0 text-xs text-muted-foreground">{call.durationSeconds ? `${Math.round(call.durationSeconds / 60)} min` : "—"}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{call.endedAt && formatRelativeTime(call.endedAt, new Date())}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <RealCallReviewDialog call={reviewCall} lead={reviewLead} onOpenChange={(open) => !open && setReviewCallId(null)} />
      <LeadProfileDrawer lead={selected} onOpenChange={(open) => !open && setSelectedLeadId(null)} />
    </div>
  )
}
