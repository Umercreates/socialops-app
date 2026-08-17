"use client"

import * as React from "react"
import Link from "next/link"
import { CalendarClock, Loader2, CircleCheck, PlugZap, TriangleAlert, CircleAlert } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getMockAvailableSlots, simulateBookMeeting } from "@/lib/integrations/calendar"
import { TEAM_MEMBERS } from "@/lib/data/settings"
import { useMeetings } from "@/lib/store/meetings-store"
import { useLeads } from "@/lib/store/leads-store"
import { useDemoMode } from "@/lib/demo-mode-context"
import { useProviderStatus } from "@/lib/hooks/use-provider-status"
import type { Lead } from "@/types"

const SLOTS = getMockAvailableSlots(5)
const TIMEZONE = "Asia/Karachi"

/** The real booking form, shown once Google Calendar is genuinely live -
 * a real start time + duration, posted to /api/meetings, which creates an
 * actual Google Calendar event (with a real Meet link only if Google's
 * response includes one) before this ever shows a success state. */
function RealBookingForm({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { setMeetingStatus, setStage, addNote } = useLeads()
  const [startLocal, setStartLocal] = React.useState("")
  const [durationMinutes, setDurationMinutes] = React.useState("30")
  const [step, setStep] = React.useState<"form" | "booking" | "done">("form")
  const [error, setError] = React.useState<string | null>(null)
  const [meetLink, setMeetLink] = React.useState<string | null>(null)

  async function handleBook() {
    if (!startLocal) return
    setStep("booking")
    setError(null)
    try {
      const start = new Date(startLocal)
      const end = new Date(start.getTime() + Number(durationMinutes) * 60000)
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          leadId: lead.id,
          title: `Meeting with ${lead.name}`,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          attendeeEmails: lead.email ? [lead.email] : [],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Couldn't book the meeting.")
        setStep("form")
        return
      }
      setMeetLink(data.meeting?.meetLink ?? null)
      setMeetingStatus(lead.id, "scheduled")
      setStage(lead.id, "meeting-booked")
      addNote(lead.id, `Meeting booked for ${start.toLocaleString()}.`)
      setStep("done")
    } catch {
      setError("Couldn't reach the server.")
      setStep("form")
    }
  }

  if (step === "booking") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Loader2 className="size-6 animate-spin text-brand" />
        <p className="text-sm font-medium text-foreground">Creating the calendar event…</p>
      </div>
    )
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-success/10">
          <CircleCheck className="size-5.5 text-success" />
        </div>
        <p className="text-sm font-medium text-foreground">Meeting booked</p>
        {meetLink && (
          <a href={meetLink} target="_blank" rel="noreferrer noopener" className="text-xs text-brand hover:underline">
            {meetLink}
          </a>
        )}
        <Button className="mt-2 w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meeting-start">Start time</Label>
          <Input id="meeting-start" type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Duration</Label>
          <Select value={durationMinutes} onValueChange={(v) => v && setDurationMinutes(v)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
      <DialogFooter>
        <Button onClick={handleBook} disabled={!startLocal}>
          <CalendarClock />
          Book meeting
        </Button>
      </DialogFooter>
    </>
  )
}

export function BookMeetingDialog({ lead, open, onOpenChange }: { lead: Lead | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const demoMode = useDemoMode()
  const { view, loading, isLive } = useProviderStatus("google-calendar")
  const { addMeeting } = useMeetings()
  const { setMeetingStatus, setStage, addNote } = useLeads()
  const [slotKey, setSlotKey] = React.useState(`${SLOTS[0].date}|${SLOTS[0].time}`)
  const [assignedTo, setAssignedTo] = React.useState(TEAM_MEMBERS[0]?.id ?? "")
  const [notes, setNotes] = React.useState("")
  const [step, setStep] = React.useState<"form" | "booking" | "done">("form")

  const [prevLeadId, setPrevLeadId] = React.useState(lead?.id ?? null)
  if ((lead?.id ?? null) !== prevLeadId) {
    setPrevLeadId(lead?.id ?? null)
    setStep("form")
    setNotes("")
  }

  async function handleBook() {
    if (!lead) return
    setStep("booking")
    const [date, time] = slotKey.split("|")
    const result = await simulateBookMeeting()
    addMeeting({
      id: `meet_new_${Date.now()}`,
      leadId: lead.id,
      date,
      time,
      timezone: TIMEZONE,
      customerName: lead.name,
      phone: lead.whatsappNumber,
      email: lead.email,
      service: lead.qualification.serviceInterested,
      assignedTo,
      meetingLink: result.meetingLink,
      status: "scheduled",
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    })
    setMeetingStatus(lead.id, "scheduled")
    setStage(lead.id, "meeting-booked")
    addNote(lead.id, `Meeting booked for ${date} ${time} (${TIMEZONE}).`)
    setStep("done")
  }

  // Outside demo mode, booking creates a genuine Google Calendar event
  // once a calendar is connected and selected - never a fabricated
  // meeting or Meet link. Not-connected is handled honestly, distinctly
  // from the real booking form below.
  if (!demoMode && lead) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Book a meeting with {lead.name}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Checking Google Calendar...
            </div>
          ) : !isLive ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <TriangleAlert className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Google Calendar isn&apos;t connected</p>
              <p className="text-xs text-muted-foreground">
                {view?.status === "not_configured" ? "Connect it in Integrations to book real meetings." : "Finish setup in Integrations to activate it."}
              </p>
              <Button size="sm" className="mt-1" render={<Link href="/dashboard/integrations" />} nativeButton={false}>
                <PlugZap />
                Connect Google Calendar
              </Button>
            </div>
          ) : (
            <RealBookingForm lead={lead} onClose={() => onOpenChange(false)} />
          )}
          {(loading || !isLive) && (
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {lead && step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Book a meeting with {lead.name}</DialogTitle>
              <DialogDescription>Demo mode — no Google Calendar is connected, this simulates booking without creating a real event.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Time slot ({TIMEZONE})</Label>
                <Select value={slotKey} onValueChange={(v) => v && setSlotKey(v)}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLOTS.map((slot) => (
                      <SelectItem key={`${slot.date}|${slot.time}`} value={`${slot.date}|${slot.time}`}>
                        {slot.date} · {slot.time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Assigned team member</Label>
                <Select value={assignedTo} onValueChange={(v) => v && setAssignedTo(v)}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_MEMBERS.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="meeting-notes">Notes</Label>
                <Textarea id="meeting-notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-16 resize-none" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleBook}>
                <CalendarClock />
                Book meeting
              </Button>
            </DialogFooter>
          </>
        )}
        {step === "booking" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="size-6 animate-spin text-brand" />
            <p className="text-sm font-medium text-foreground">Booking meeting…</p>
          </div>
        )}
        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-success/10">
              <CircleCheck className="size-5.5 text-success" />
            </div>
            <p className="text-sm font-medium text-foreground">Meeting booked</p>
            <p className="text-xs text-muted-foreground">A confirmation would normally be sent via WhatsApp and email.</p>
            <Button className="mt-2 w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
