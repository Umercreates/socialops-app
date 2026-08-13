import type { Metadata } from "next"
import { CalendarPageContent } from "@/components/calendar/calendar-page-content"

export const metadata: Metadata = { title: "Content Calendar — EasyLife" }

export default function ContentCalendarPage() {
  return <CalendarPageContent />
}
