import type { Metadata } from "next"
import { AnalyticsPageContent } from "@/components/analytics/analytics-page-content"
import { getAnalyticsOverview } from "@/lib/services/analytics-service"

export const metadata: Metadata = { title: "Analytics — EasyLife" }

export default async function AnalyticsPage() {
  const overview = await getAnalyticsOverview()
  return <AnalyticsPageContent overview={overview} />
}
