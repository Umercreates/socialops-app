"use client"

import { Radio, Users, Zap, Send, CalendarClock, MessageSquare, MessageCircle, Workflow } from "lucide-react"
import { MetricCard } from "@/components/dashboard/metric-card"
import { AnimatedNumber } from "@/components/dashboard/animated-number"
import { SecondaryStatStrip, type SecondaryStat } from "@/components/dashboard/secondary-stat-strip"
import { formatCompactNumber } from "@/lib/format"
import { useSocialAccounts } from "@/lib/store/accounts-store"
import { usePosts } from "@/lib/store/posts-store"
import type { DashboardSummary } from "@/types"

/** Wraps the server-computed summary but overrides the two numbers that the
 * demo actually mutates live (connected accounts, scheduled posts) so the
 * KPI row never contradicts the Accounts page or the composer in the same
 * session. Followers/engagement/published stay the server snapshot — those
 * would need a real backend to recompute meaningfully. */
export function DashboardKpis({ summary }: { summary: DashboardSummary }) {
  const { accounts } = useSocialAccounts()
  const { posts } = usePosts()

  const connectedAccounts = accounts.filter((a) => a.health !== "disconnected").length
  const scheduledPosts = posts.filter((p) => p.status === "scheduled").length

  const secondaryStats: SecondaryStat[] = [
    { icon: CalendarClock, label: "Scheduled posts", value: formatCompactNumber(scheduledPosts) },
    { icon: MessageSquare, label: "New comments (7d)", value: formatCompactNumber(summary.newComments7d) },
    { icon: MessageCircle, label: "Unread DMs", value: formatCompactNumber(summary.unreadDms) },
    { icon: Workflow, label: "Pending automations", value: formatCompactNumber(summary.pendingAutomationTasks) },
  ]

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Radio}
          label="Connected accounts"
          value={`${connectedAccounts}/${accounts.length}`}
          caption="All platforms linked"
        />
        <MetricCard
          icon={Users}
          label="Total followers"
          value={<AnimatedNumber value={summary.totalFollowers} format={formatCompactNumber} />}
          delta={{ value: summary.totalFollowersDelta30d, suffix: "", compact: true }}
          caption="vs. 30 days ago"
        />
        <MetricCard
          icon={Zap}
          label="Engagement rate"
          value={<AnimatedNumber value={summary.engagementRate30d} format={(n) => `${n.toFixed(1)}%`} />}
          delta={{ value: summary.engagementRateDelta30d, suffix: "pts", decimals: 1 }}
          caption="30-day average"
        />
        <MetricCard
          icon={Send}
          label="Posts published"
          value={<AnimatedNumber value={summary.postsPublished30d} format={formatCompactNumber} />}
          caption="Last 30 days"
        />
      </div>

      <SecondaryStatStrip stats={secondaryStats} />
    </>
  )
}
