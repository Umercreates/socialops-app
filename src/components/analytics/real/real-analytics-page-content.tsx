"use client"

import * as React from "react"
import { Users, Send, MessageCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/dashboard/metric-card"
import { PlatformFilter, type PlatformFilterValue } from "@/components/dashboard/platform-filter"
import { NoProviderAnalyticsCard } from "@/components/dashboard/real/no-provider-analytics-card"
import { RealPlatformPerformanceBars } from "@/components/analytics/real/real-platform-performance-bars"
import { RealRecentContent } from "@/components/analytics/real/real-recent-content"
import { RealLeadSources } from "@/components/analytics/real/real-lead-sources"
import { formatCompactNumber } from "@/lib/format"
import type { BusinessAnalyticsOverview, MessagingAnalytics, PlatformPublishPerformance } from "@/lib/platform/business-analytics"
import type { Post } from "@/types"

interface RealAnalyticsPageContentProps {
  analytics: BusinessAnalyticsOverview
  messaging: MessagingAnalytics
  platformPerformance: PlatformPublishPerformance[]
  totalFollowers: number
  posts: Post[]
}

function formatResponseTime(minutes: number | null) {
  if (minutes === null) return "No replies yet"
  if (minutes < 60) return `${minutes}m`
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)}h`
  return `${Math.round(minutes / (24 * 60))}d`
}

export function RealAnalyticsPageContent({ analytics, messaging, platformPerformance, totalFollowers, posts }: RealAnalyticsPageContentProps) {
  const [platformFilter, setPlatformFilter] = React.useState<PlatformFilterValue>("all")

  const publishSuccessRate = analytics.postTargets.total === 0 ? 0 : Math.round((analytics.postTargets.published / analytics.postTargets.total) * 100)

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground">Real business performance across your workspace.</p>
        </div>
        <PlatformFilter value={platformFilter} onChange={setPlatformFilter} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Total followers" value={formatCompactNumber(totalFollowers)} caption="Across connected accounts" />
        <MetricCard icon={Send} label="Publish success rate" value={`${publishSuccessRate}%`} caption={`${analytics.postTargets.published}/${analytics.postTargets.total} targets`} />
        <MetricCard
          icon={MessageCircle}
          label="WhatsApp response rate"
          value={`${messaging.responseRate}%`}
          caption={`${messaging.totalConversations} conversations (90d)`}
        />
        <MetricCard icon={Clock} label="Avg. response time" value={formatResponseTime(messaging.avgResponseMinutes)} caption="First reply" />
      </div>

      <NoProviderAnalyticsCard />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <CardHeader className="px-0">
            <CardTitle className="text-[15px]">Platform publish performance</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <RealPlatformPerformanceBars data={platformPerformance} />
          </CardContent>
        </Card>

        <Card className="gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <CardHeader className="px-0">
            <CardTitle className="text-[15px]">Lead sources</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <RealLeadSources bySource={analytics.leads.bySource} />
          </CardContent>
        </Card>
      </div>

      <Card className="gap-3 px-4 py-4 sm:px-5 sm:py-5">
        <CardHeader className="px-0">
          <CardTitle className="text-[15px]">Recently published</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <RealRecentContent posts={posts} platformFilter={platformFilter} />
        </CardContent>
      </Card>
    </div>
  )
}
