import type { Metadata } from "next"

import { DashboardKpis } from "@/components/dashboard/dashboard-kpis"
import { EngagementSection } from "@/components/dashboard/engagement-section"
import { SalesFunnelSection } from "@/components/dashboard/sales-funnel-section"
import { AccountSummary } from "@/components/dashboard/account-summary"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { UpcomingPosts } from "@/components/dashboard/upcoming-posts"
import { CURRENT_WORKSPACE } from "@/lib/data/workspace"
import { getDashboardSummary, getActivityFeed, getEngagementOverview } from "@/lib/services/dashboard-service"

export const metadata: Metadata = { title: "Dashboard — Easyland" }

export default async function DashboardOverviewPage() {
  const [summary, activity, engagement] = await Promise.all([
    getDashboardSummary(),
    getActivityFeed(6),
    getEngagementOverview(),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Overview</h2>
        <p className="text-sm text-muted-foreground">
          What&apos;s happening across {CURRENT_WORKSPACE.name}&apos;s connected accounts right now.
        </p>
      </div>

      <DashboardKpis summary={summary} />

      <EngagementSection seriesByRange={engagement.seriesByRange} totalsByRange={engagement.totalsByRange} />

      <SalesFunnelSection totalFollowers={summary.totalFollowers} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AccountSummary />
        <ActivityFeed items={activity} />
      </div>

      <UpcomingPosts />
    </div>
  )
}
