import type { Metadata } from "next"
import { CalendarPageContent } from "@/components/calendar/calendar-page-content"
import { DemoCalendarPageContent } from "@/components/calendar/demo-calendar-page-content"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

export const metadata: Metadata = { title: "Content Calendar — EasyLife" }

export default async function ContentCalendarPage() {
  const viewMode = await getDashboardViewMode()
  return viewMode === "client" ? <CalendarPageContent /> : <DemoCalendarPageContent />
}
