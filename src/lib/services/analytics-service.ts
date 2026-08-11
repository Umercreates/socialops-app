import { FOLLOWER_GROWTH_SERIES, PLATFORM_PERFORMANCE, getMessagingStats } from "@/lib/data/analytics-extra"
import { PUBLISHED_POSTS } from "@/lib/data/posts"
import { getTotalEngagementsSeries, getEngagementTotals } from "@/lib/data/engagement"
import type { DateRangeOption, EngagementPoint, EngagementTotals, FollowerGrowthPoint, PlatformPerformance, Post } from "@/types"

const SIMULATED_LATENCY_MS = 120
function resolveAfterDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS))
}

export interface AnalyticsOverview {
  engagementByRange: Record<DateRangeOption, EngagementPoint[]>
  engagementTotalsByRange: Record<DateRangeOption, EngagementTotals>
  followerGrowthByRange: Record<DateRangeOption, FollowerGrowthPoint[]>
  platformPerformance: PlatformPerformance[]
  topContent: Post[]
  messaging: ReturnType<typeof getMessagingStats>
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const ranges: DateRangeOption[] = ["today", "7d", "30d", "90d"]
  const engagementByRange = Object.fromEntries(ranges.map((r) => [r, getTotalEngagementsSeries(r)])) as Record<
    DateRangeOption,
    EngagementPoint[]
  >
  const engagementTotalsByRange = Object.fromEntries(ranges.map((r) => [r, getEngagementTotals(r)])) as Record<
    DateRangeOption,
    EngagementTotals
  >

  const topContent = [...PUBLISHED_POSTS]
    .filter((p) => p.analytics)
    .sort((a, b) => (b.analytics?.engagementRate ?? 0) - (a.analytics?.engagementRate ?? 0))
    .slice(0, 5)

  return resolveAfterDelay({
    engagementByRange,
    engagementTotalsByRange,
    followerGrowthByRange: FOLLOWER_GROWTH_SERIES,
    platformPerformance: PLATFORM_PERFORMANCE,
    topContent,
    messaging: getMessagingStats(),
  })
}
