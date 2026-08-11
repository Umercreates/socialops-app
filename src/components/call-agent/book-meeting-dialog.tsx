"use client"

import * as React from "react"
import { CalendarClock, Loader2, CircleCheck } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCalendarIntegrationStatus, getMockAvailableSlots, simulateBookMeeting } from "@/lib/integrations/calendar"
import { TEAM_MEMBERS } from "@/lib/data/settings"
import { useMeetings } from "@/lib/store/meetings-store"
import { useLeads } from "@/lib/store/leads-store"
import type { Lead } from "@/types"

const SLOTS = getMockAvailableSlots(5)
const TIMEZONE = "Asia/Karachi"

export function BookMeetingDialog({ lead, open, onOpenChange }: { lead: Lead | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { addMeeting } = useMeetings()
  const { setMeetingStatus, setStage, addNote } = useLeads()
  const integrationStatus = getCalendarIntegrationStatus()
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {lead && step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Book a meeting with {lead.name}</DialogTitle>
              <DialogDescription>
                {integrationStatus.mode === "demo"
                  ? "Demo mode — no Google Calendar is connected, this simulates booking without creating a real event."
                  : "Booked directly to the connected Google Calendar."}
              </DialogDescription>
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
