"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { CALL_STATUS_LABEL, CALL_STATUS_TONE } from "@/lib/lead-status"
import type { Call, Lead } from "@/types"

/** Read-only review of a real completed/failed call - no live-typing
 * simulation, since a real call is dispatched to OmniDimension and its
 * transcript/summary only exist once the provider's post-call webhook has
 * delivered them (see applyCallWebhookResult). */
export function RealCallReviewDialog({ call, lead, onOpenChange }: { call: Call | null; lead: Lead | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={Boolean(call)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Call with {lead?.name ?? "lead"}</DialogTitle>
        </DialogHeader>
        {call && (
          <div className="flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center gap-2">
              <StatusBadge tone={CALL_STATUS_TONE[call.status]}>{CALL_STATUS_LABEL[call.status]}</StatusBadge>
              {call.durationSeconds !== undefined && (
                <span className="text-xs text-muted-foreground">{Math.round(call.durationSeconds / 60)} min</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.3fr_1fr]">
              <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                <span className="text-xs font-semibold text-muted-foreground">Transcript</span>
                {call.transcript.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No transcript available for this call.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {call.transcript.map((line) => (
                      <div key={line.id} className="flex flex-col gap-0.5 rounded-lg bg-card px-2.5 py-1.5 text-xs ring-1 ring-border">
                        <span className="text-[10px] font-medium text-muted-foreground">{line.speaker === "agent" ? "AI Agent" : lead?.name ?? "Lead"}</span>
                        {line.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                <span className="text-xs font-semibold text-muted-foreground">Summary</span>
                {!call.summary ? (
                  <p className="text-xs text-muted-foreground">No summary available for this call.</p>
                ) : (
                  <p className="text-xs text-foreground">{call.summary.recommendedNextAction ?? "No summary text."}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
