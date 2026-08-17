import type { Metadata } from "next"
import { AnalyticsPageContent } from "@/components/analytics/analytics-page-content"
import { RealAnalyticsPageContent } from "@/components/analytics/real/real-analytics-page-content"
import { getAnalyticsOverview } from "@/lib/services/analytics-service"
import { requireAuth } from "@/lib/auth/guard"
import { listSocialAccounts } from "@/lib/platform/social-accounts"
import { listPosts } from "@/lib/platform/posts"
import { getBusinessAnalytics, getMessagingAnalytics, getPlatformPublishPerformance } from "@/lib/platform/business-analytics"

export const metadata: Metadata = { title: "Analytics — EasyLife" }

export default async function AnalyticsPage() {
  const crmMode = process.env.CRM_MODE === "database" ? "database" : "demo"
  if (crmMode === "database") return <RealAnalyticsPage />

  const overview = await getAnalyticsOverview()
  return <AnalyticsPageContent overview={overview} />
}

async function RealAnalyticsPage() {
  const auth = await requireAuth()
  if (!auth.ok) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <p className="text-sm text-muted-foreground">Your session has expired. Please sign in again.</p>
      </div>
    )
  }

  const { workspaceId } = auth.ctx
  const [accounts, posts, analytics, messaging, platformPerformance] = await Promise.all([
    listSocialAccounts(workspaceId),
    listPosts(workspaceId),
    getBusinessAnalytics(workspaceId),
    getMessagingAnalytics(workspaceId),
    getPlatformPublishPerformance(workspaceId),
  ])

  const totalFollowers = accounts.reduce((total, a) => total + a.followers, 0)

  return (
    <RealAnalyticsPageContent
      analytics={analytics}
      messaging={messaging}
      platformPerformance={platformPerformance}
      totalFollowers={totalFollowers}
      posts={posts}
    />
  )
}
