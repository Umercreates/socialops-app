"use client"

import * as React from "react"
import { PhoneOff, CalendarPlus, Sparkles, Circle } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { BookMeetingDialog } from "@/components/call-agent/book-meeting-dialog"
import { simulateCallTranscript, summarizeSimulatedCall } from "@/lib/integrations/calling"
import { useCalls, useCallQueue } from "@/lib/store/calls-store"
import { useLeads } from "@/lib/store/leads-store"
import { useGoogleSheets } from "@/lib/store/sheets-store"
import type { Call, Lead } from "@/types"
import { cn } from "@/lib/utils"

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function LiveCallDialog({ lead, onOpenChange }: { lead: Lead | null; onOpenChange: (open: boolean) => void }) {
  const { calls, startCall, appendTranscriptLine, endCall } = useCalls()
  const { queue, setStatus: setQueueStatus } = useCallQueue()
  const { setCallStatus, setStage, setScore, addNote, markSheetSynced } = useLeads()
  const { syncLead } = useGoogleSheets()
  const [callId, setCallId] = React.useState<string | null>(null)
  const [elapsed, setElapsed] = React.useState(0)
  const [phase, setPhase] = React.useState<"connecting" | "live" | "ended">("connecting")
  const [bookingOpen, setBookingOpen] = React.useState(false)
  const stoppedRef = React.useRef(false)

  const activeCall = calls.find((c) => c.id === callId) ?? null

  const finishCall = React.useCallback(
    (queueItemId: string | undefined, targetLead: Lead) => {
      if (stoppedRef.current) return
      stoppedRef.current = true
      const summary = summarizeSimulatedCall()
      if (callId) endCall(callId, "interested", summary)
      setCallStatus(targetLead.id, "interested")
      setStage(targetLead.id, "called")
      if (summary.updatedScore) setScore(targetLead.id, summary.updatedScore)
      if (summary.recommendedNextAction) addNote(targetLead.id, summary.recommendedNextAction)
      if (queueItemId) setQueueStatus(queueItemId, "interested")
      setPhase("ended")

      const callForSync: Call = { id: callId ?? `call_${Date.now()}`, leadId: targetLead.id, status: "interested", transcript: activeCall?.transcript ?? [], summary }
      const updatedLead: Lead = { ...targetLead, score: summary.updatedScore ?? targetLead.score, callStatus: "interested", stage: "called" }
      syncLead(updatedLead, callForSync).then(() => markSheetSynced(targetLead.id))
    },
    [callId, endCall, setCallStatus, setStage, setScore, addNote, setQueueStatus, syncLead, markSheetSynced, activeCall]
  )

  // Kick off the call once a lead is provided — resets synchronously so the
  // transcript stream and timer never bleed across two different leads.
  const [prevLeadId, setPrevLeadId] = React.useState<string | null>(null)
  if ((lead?.id ?? null) !== prevLeadId) {
    setPrevLeadId(lead?.id ?? null)
    if (lead) {
      setElapsed(0)
      setPhase("connecting")
      const id = startCall(lead.id)
      setCallId(id)
      const queueItem = queue.find((q) => q.leadId === lead.id)
      if (queueItem) setQueueStatus(queueItem.id, "calling")
    } else {
      setCallId(null)
    }
  }

  React.useEffect(() => {
    if (!lead || !callId) return
    const currentLead = lead
    const currentCallId = callId
    stoppedRef.current = false
    let cancelled = false
    const connectTimer = setTimeout(() => !cancelled && setPhase("live"), 900)

    async function run() {
      for await (const line of simulateCallTranscript()) {
        if (cancelled || stoppedRef.current) return
        appendTranscriptLine(currentCallId, line)
      }
      if (!cancelled) {
        const queueItem = queue.find((q) => q.leadId === currentLead.id)
        finishCall(queueItem?.id, currentLead)
      }
    }
    run()

    return () => {
      cancelled = true
      clearTimeout(connectTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId])

  React.useEffect(() => {
    if (phase !== "live") return
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

  function handleEndCall() {
    if (!lead) return
    const queueItem = queue.find((q) => q.leadId === lead.id)
    finishCall(queueItem?.id, lead)
  }

  const transcript = activeCall?.transcript ?? []
  const summary = activeCall?.summary

  return (
    <Dialog open={Boolean(lead)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-4 sm:max-w-2xl" showCloseButton={phase === "ended"}>
        <DialogTitle className="sr-only">Live call with {lead?.name}</DialogTitle>
        {lead && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                  {lead.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{lead.name}</span>
                  <span className="text-xs text-muted-foreground">{lead.whatsappNumber}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {phase !== "ended" && (
                  <StatusBadge tone={phase === "connecting" ? "warning" : "success"}>
                    <Circle className={cn("size-2 fill-current", phase === "live" && "animate-pulse")} />
                    {phase === "connecting" ? "Connecting…" : "Connected"}
                  </StatusBadge>
                )}
                {phase === "ended" && <StatusBadge tone="neutral">Call ended</StatusBadge>}
                <span className="font-mono text-sm tabular-nums text-muted-foreground">{formatElapsed(elapsed)}</span>
              </div>
            </div>

            <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning-foreground dark:text-warning">
              Simulated call — no real telephony is connected. This demonstrates the AI call agent UX end-to-end.
            </p>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[1.3fr_1fr]">
              <div className="flex min-h-0 flex-col gap-2 rounded-lg bg-muted/40 p-3">
                <span className="text-xs font-semibold text-muted-foreground">Live transcript</span>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                  {transcript.length === 0 && <p className="text-xs text-muted-foreground">Waiting for the call to connect…</p>}
                  {transcript.map((line) => (
                    <div key={line.id} className={cn("flex flex-col gap-0.5 rounded-lg px-2.5 py-1.5 text-xs", line.speaker === "agent" ? "bg-brand/10 text-foreground" : "bg-card text-foreground ring-1 ring-border")}>
                      <span className="text-[10px] font-medium text-muted-foreground">{line.speaker === "agent" ? "AI Agent" : lead.name.split(" ")[0]}</span>
                      {line.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex min-h-0 flex-col gap-2 overflow-y-auto rounded-lg bg-muted/40 p-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Sparkles className="size-3.5" />
                  AI notes
                </span>
                {!summary ? (
                  <p className="text-xs text-muted-foreground">Analyzing the conversation as it happens…</p>
                ) : (
                  <div className="flex flex-col gap-2 text-xs">
                    <NoteRow label="Requirement" value={summary.requirements} />
                    <NoteRow label="Pain point" value={summary.painPoints} />
                    <NoteRow label="Budget" value={summary.budget} />
                    <NoteRow label="Timeline" value={summary.timeline} />
                    <NoteRow label="Interested in" value={summary.interestedService} />
                    <NoteRow label="Objections" value={summary.objections} />
                    {summary.buyingIntent && <NoteRow label="Buying intent" value={summary.buyingIntent} />}
                    {summary.recommendedNextAction && <NoteRow label="Next action" value={summary.recommendedNextAction} />}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <Button variant="outline" onClick={() => setBookingOpen(true)}>
                <CalendarPlus />
                Book meeting
              </Button>
              {phase !== "ended" ? (
                <Button variant="destructive" onClick={handleEndCall}>
                  <PhoneOff />
                  End call
                </Button>
              ) : (
                <Button onClick={() => onOpenChange(false)}>Done</Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
      <BookMeetingDialog lead={lead} open={bookingOpen} onOpenChange={setBookingOpen} />
    </Dialog>
  )
}

function NoteRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      <span className="text-foreground capitalize">{value}</span>
    </div>
  )
}
