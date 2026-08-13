"use client"

import * as React from "react"
import { Users, Zap, MessageCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/dashboard/metric-card"
import { DateRangeFilter } from "@/components/dashboard/date-range-filter"
import { PlatformFilter, type PlatformFilterValue } from "@/components/dashboard/platform-filter"
import { EngagementChart } from "@/components/dashboard/engagement-chart"
import { PlatformPerformanceBars } from "@/components/analytics/platform-performance-bars"
import { TopPerformingContent } from "@/components/analytics/top-performing-content"
import { formatCompactNumber } from "@/lib/format"
import type { AnalyticsOverview } from "@/lib/services/analytics-service"
import type { DateRangeOption } from "@/types"

export function AnalyticsPageContent({ overview }: { overview: AnalyticsOverview }) {
  const [range, setRange] = React.useState<DateRangeOption>("30d")
  const [platformFilter, setPlatformFilter] = React.useState<PlatformFilterValue>("all")

  const engagementTotals = overview.engagementTotalsByRange[range]
  const engagementSeries = overview.engagementByRange[range]
  const followerSeries = overview.followerGrowthByRange[range].map((p) => ({ date: p.date, value: p.followers }))
  const latestFollowers = followerSeries[followerSeries.length - 1]?.value ?? 0
  const firstFollowers = followerSeries[0]?.value ?? latestFollowers
  const followerDelta = firstFollowers === 0 ? 0 : Math.round(((latestFollowers - firstFollowers) / firstFollowers) * 1000) / 10

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground">Performance across every connected account.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlatformFilter value={platformFilter} onChange={setPlatformFilter} />
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total followers"
          value={formatCompactNumber(latestFollowers)}
          delta={{ value: followerDelta, suffix: "%" }}
          caption={`vs. start of range`}
        />
        <MetricCard
          icon={Zap}
          label="Total engagements"
          value={formatCompactNumber(engagementTotals.engagements)}
          delta={{ value: engagementTotals.engagementsDelta, suffix: "%" }}
          caption="vs. prior period"
        />
        <MetricCard
          icon={MessageCircle}
          label="Response rate"
          value={`${overview.messaging.responseRate}%`}
          caption={`${overview.messaging.totalConversations} conversations`}
        />
        <MetricCard icon={Clock} label="Avg. response time" value={overview.messaging.responseTimeLabel} caption="First reply" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <CardHeader className="px-0">
            <CardTitle className="text-[15px]">Follower growth</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <EngagementChart data={followerSeries} />
          </CardContent>
        </Card>

        <Card className="gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <CardHeader className="px-0">
            <CardTitle className="text-[15px]">Engagement</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <EngagementChart data={engagementSeries} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <CardHeader className="px-0">
            <CardTitle className="text-[15px]">Platform performance</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <PlatformPerformanceBars data={overview.platformPerformance} />
          </CardContent>
        </Card>

        <Card className="gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <CardHeader className="px-0">
            <CardTitle className="text-[15px]">Top performing content</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <TopPerformingContent posts={overview.topContent} platformFilter={platformFilter} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
