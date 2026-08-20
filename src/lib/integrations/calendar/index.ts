/**
 * Google Calendar integration seam. A real implementation needs a Google
 * Cloud project, OAuth consent, and the Calendar API enabled — free to set
 * up, but nothing here claims that's done. Slot generation and booking are
 * both local simulations, used only by the demo-mode branch of
 * book-meeting-dialog.tsx/call-agent-settings.tsx.
 *
 * The REAL per-workspace status comes from useProviderStatus("google-calendar")
 * - never from a DEMO_MODE flag, which has no way to know whether any real
 * workspace has actually connected anything.
 */

export interface TimeSlot {
  date: string
  time: string
}

/** Deterministic mock availability — a real integration reads free/busy
 * from the connected calendar instead. */
export function getMockAvailableSlots(daysAhead = 5): TimeSlot[] {
  const slots: TimeSlot[] = []
  const base = new Date("2026-08-10T00:00:00Z")
  const times = ["10:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"]
  for (let d = 0; d < daysAhead; d++) {
    const day = new Date(base)
    day.setUTCDate(day.getUTCDate() + d)
    const dateStr = day.toISOString().slice(0, 10)
    times.forEach((time) => slots.push({ date: dateStr, time }))
  }
  return slots
}

export interface BookMeetingResult {
  ok: boolean
  meetingLink: string
}

/** Simulated — a real integration calls calendar.events.insert. Uses a
 * deliberately fake URI scheme (never meet.google.com) so a demo meeting
 * link can never be mistaken for a real, clickable Google Meet room. */
export async function simulateBookMeeting(): Promise<BookMeetingResult> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return { ok: true, meetingLink: `demo://meeting/${Math.random().toString(36).slice(2, 8)}` }
}
