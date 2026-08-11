import { SOCIAL_ACCOUNTS } from "@/lib/data/accounts"
import { SCHEDULED_POSTS, SCHEDULED_POSTS_TOTAL, POSTS_PUBLISHED_30D } from "@/lib/data/posts"
import { ACTIVITY_FEED } from "@/lib/data/activity"
import { NOTIFICATIONS } from "@/lib/data/notifications"
import {
  getEngagementTotals,
  getEngagementRate,
  getEngagementRateDelta,
  getTotalEngagementsSeries,
} from "@/lib/data/engagement"
import type {
  ActivityItem,
  DashboardSummary,
  DateRangeOption,
  EngagementPoint,
  EngagementTotals,
  Notification,
  Post,
  SocialAccount,
} from "@/types"

/**
 * Mock service boundary for the dashboard overview.
 *
 * This is the seam a real backend integration replaces in a later phase:
 * every export here returns a Promise and reads only from `lib/data`, so
 * swapping in real API calls means rewriting this file's internals without
 * touching any component that consumes it.
 */

const SIMULATED_LATENCY_MS = 120

function resolveAfterDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS))
}

const SUPPORTED_PLATFORM_COUNT = 6

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const totalFollowers = SOCIAL_ACCOUNTS.reduce((total, account) => total + account.followers, 0)
  const totalFollowersDelta30d = SOCIAL_ACCOUNTS.reduce(
    (total, account) => total + account.followersDelta30d,
    0
  )
  const connectedAccounts = SOCIAL_ACCOUNTS.filter((account) => account.health !== "disconnected").length

  const summary: DashboardSummary = {
    connectedAccounts,
    totalAccounts: SUPPORTED_PLATFORM_COUNT,
    postsPublished30d: POSTS_PUBLISHED_30D,
    scheduledPosts: SCHEDULED_POSTS_TOTAL,
    totalFollowers,
    totalFollowersDelta30d,
    engagementRate30d: getEngagementRate("30d"),
    engagementRateDelta30d: getEngagementRateDelta("30d"),
    newComments7d: 24,
    unreadDms: 9,
    pendingAutomationTasks: 3,
  }

  return resolveAfterDelay(summary)
}

export async function getSocialAccounts(): Promise<SocialAccount[]> {
  return resolveAfterDelay(SOCIAL_ACCOUNTS)
}

export async function getUpcomingPosts(limit = 5): Promise<Post[]> {
  return resolveAfterDelay(SCHEDULED_POSTS.slice(0, limit))
}

export async function getActivityFeed(limit = 6): Promise<ActivityItem[]> {
  return resolveAfterDelay(ACTIVITY_FEED.slice(0, limit))
}

export async function getNotifications(): Promise<Notification[]> {
  return resolveAfterDelay(NOTIFICATIONS)
}

export interface EngagementOverview {
  seriesByRange: Record<DateRangeOption, EngagementPoint[]>
  totalsByRange: Record<DateRangeOption, EngagementTotals>
}

/** Preloads every date range so the client-side filter can switch instantly
 * without a network round trip — appropriate for this dataset's size. The
 * chart plots a single "total engagements" series (likes + comments +
 * shares) rather than the three separately, since shares and comments run
 * an order of magnitude below likes and would flatten unreadably on a
 * shared axis; their individual totals still surface as stat tiles. */
export async function getEngagementOverview(): Promise<EngagementOverview> {
  const ranges: DateRangeOption[] = ["today", "7d", "30d", "90d"]
  const totalsByRange = Object.fromEntries(
    ranges.map((range) => [range, getEngagementTotals(range)])
  ) as Record<DateRangeOption, EngagementTotals>
  const seriesByRange = Object.fromEntries(
    ranges.map((range) => [range, getTotalEngagementsSeries(range)])
  ) as Record<DateRangeOption, EngagementPoint[]>

  return resolveAfterDelay({
    seriesByRange,
    totalsByRange,
  })
}
