import { DEMO_MODE } from "@/lib/demo-mode"

/**
 * Google Calendar integration seam. A real implementation needs a Google
 * Cloud project, OAuth consent, and the Calendar API enabled — free to set
 * up, but nothing here claims that's done. Slot generation and booking are
 * both local simulations.
 */

export interface CalendarIntegrationStatus {
  configured: boolean
  mode: "demo" | "live"
  provider: "google-calendar"
}

export function getCalendarIntegrationStatus(): CalendarIntegrationStatus {
  return { configured: !DEMO_MODE, mode: DEMO_MODE ? "demo" : "live", provider: "google-calendar" }
}

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

/** Simulated — a real integration calls calendar.events.insert. */
export async function simulateBookMeeting(): Promise<BookMeetingResult> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return { ok: true, meetingLink: `https://meet.google.com/demo-${Math.random().toString(36).slice(2, 8)}` }
}
