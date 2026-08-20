import type { Metadata } from "next"

import { DashboardKpis } from "@/components/dashboard/dashboard-kpis"
import { EngagementSection } from "@/components/dashboard/engagement-section"
import { SalesFunnelSection } from "@/components/dashboard/sales-funnel-section"
import { AccountSummary } from "@/components/dashboard/account-summary"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { UpcomingPosts } from "@/components/dashboard/upcoming-posts"
import { RealDashboardKpis } from "@/components/dashboard/real/real-dashboard-kpis"
import { NoProviderAnalyticsCard } from "@/components/dashboard/real/no-provider-analytics-card"
import { RealSalesFunnelSection } from "@/components/dashboard/real/real-sales-funnel-section"
import { RealAccountSummary } from "@/components/dashboard/real/real-account-summary"
import { RealActivityFeed } from "@/components/dashboard/real/real-activity-feed"
import { RealUpcomingPosts } from "@/components/dashboard/real/real-upcoming-posts"
import { SetupProgressCard } from "@/components/dashboard/real/setup-progress-card"
import { CURRENT_WORKSPACE } from "@/lib/data/workspace"
import { getDashboardSummary, getActivityFeed, getEngagementOverview } from "@/lib/services/dashboard-service"
import { requireAuth } from "@/lib/auth/guard"
import { listSocialAccounts } from "@/lib/platform/social-accounts"
import { listPosts } from "@/lib/platform/posts"
import { getBusinessAnalytics, getSetupProgress, getRecentActivity } from "@/lib/platform/business-analytics"
import { PROVIDER_REGISTRY } from "@/lib/integrations/providers"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

export const metadata: Metadata = { title: "Dashboard — EasyLife" }

export default async function DashboardOverviewPage() {
  const viewMode = await getDashboardViewMode()
  if (viewMode === "client") return <RealDashboardOverview />

  const [summary, activity, engagement] = await Promise.all([
    getDashboardSummary(),
    getActivityFeed(6),
    getEngagementOverview(),
  ])

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
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

async function RealDashboardOverview() {
  const auth = await requireAuth()
  // The proxy middleware already gates every /dashboard/** request on a
  // valid session, so this should always resolve — this is a defensive
  // fallback, not the primary auth boundary (see dashboard/layout.tsx).
  if (!auth.ok) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <p className="text-sm text-muted-foreground">Your session has expired. Please sign in again.</p>
      </div>
    )
  }

  const { workspaceId } = auth.ctx
  const totalProviders = Object.keys(PROVIDER_REGISTRY).length

  const [accounts, posts, analytics, setup, activity] = await Promise.all([
    listSocialAccounts(workspaceId),
    listPosts(workspaceId),
    getBusinessAnalytics(workspaceId),
    getSetupProgress(workspaceId, totalProviders),
    getRecentActivity(workspaceId, 6),
  ])

  const totalFollowers = accounts.reduce((total, a) => total + a.followers, 0)
  const scheduledPosts = posts.filter((p) => p.status === "scheduled").length
  const whatsappConnected = setup.liveProviderIds.includes("whatsapp")

  const showSetupCard = setup.configuredProviders < totalProviders

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Overview</h2>
        <p className="text-sm text-muted-foreground">What&apos;s happening across your connected accounts right now.</p>
      </div>

      {showSetupCard && (
        <SetupProgressCard
          configuredProviders={setup.configuredProviders}
          totalProviders={totalProviders}
          items={[
            { label: `${accounts.length} social account${accounts.length === 1 ? "" : "s"} connected`, done: accounts.length > 0 },
            { label: whatsappConnected ? "WhatsApp connected" : "No WhatsApp connected", done: whatsappConnected },
            { label: `${analytics.leads.total} lead${analytics.leads.total === 1 ? "" : "s"}`, done: analytics.leads.total > 0 },
            { label: `${scheduledPosts} scheduled post${scheduledPosts === 1 ? "" : "s"}`, done: scheduledPosts > 0 },
          ]}
        />
      )}

      <RealDashboardKpis
        connectedAccounts={accounts.filter((a) => a.health !== "disconnected").length}
        totalAccounts={accounts.length}
        totalFollowers={totalFollowers}
        postsPublished30d={analytics.posts.published}
        scheduledPosts={scheduledPosts}
        newComments7d={analytics.comments.newLast7d}
        whatsappConversations={analytics.conversations.total}
        pendingAutomationTasks={analytics.automationRuns.pendingApproval}
      />

      <NoProviderAnalyticsCard />

      <RealSalesFunnelSection analytics={analytics} whatsappConversationCount={analytics.conversations.total} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RealAccountSummary accounts={accounts} />
        <RealActivityFeed items={activity} />
      </div>

      <RealUpcomingPosts posts={posts} />
    </div>
  )
}
