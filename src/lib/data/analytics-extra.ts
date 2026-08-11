import type { DateRangeOption, FollowerGrowthPoint, PlatformPerformance } from "@/types"
import { SOCIAL_ACCOUNTS } from "./accounts"
import { CONVERSATIONS } from "./conversations"
import { createSeededRandom } from "./random"

const POINT_COUNT: Record<DateRangeOption, number> = { today: 8, "7d": 7, "30d": 30, "90d": 90 }
const LABELS_TODAY = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"]
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const TOTAL_FOLLOWERS = SOCIAL_ACCOUNTS.reduce((sum, a) => sum + a.followers, 0)

function buildFollowerGrowth(range: DateRangeOption): FollowerGrowthPoint[] {
  const rand = createSeededRandom(range === "today" ? 501 : range === "7d" ? 502 : range === "30d" ? 503 : 504)
  const points = POINT_COUNT[range]
  const growthOverRange = range === "today" ? 0.001 : range === "7d" ? 0.006 : range === "30d" ? 0.026 : 0.07
  const startFollowers = Math.round(TOTAL_FOLLOWERS / (1 + growthOverRange))

  return Array.from({ length: points }, (_, i) => {
    const t = points <= 1 ? 0 : i / (points - 1)
    const noise = 1 + (rand() - 0.5) * 0.01
    const value = Math.round((startFollowers + (TOTAL_FOLLOWERS - startFollowers) * t) * noise)
    let label: string
    if (range === "today") label = LABELS_TODAY[i]
    else if (range === "7d") label = WEEKDAY_LABELS[i % 7]
    else {
      const dayOffset = points - 1 - i
      label = dayOffset === 0 ? "Today" : `${dayOffset}d`
    }
    return { date: label, followers: value }
  })
}

export const FOLLOWER_GROWTH_SERIES: Record<DateRangeOption, FollowerGrowthPoint[]> = {
  today: buildFollowerGrowth("today"),
  "7d": buildFollowerGrowth("7d"),
  "30d": buildFollowerGrowth("30d"),
  "90d": buildFollowerGrowth("90d"),
}

const PLATFORM_ENGAGEMENT_RATE: Record<string, number> = {
  instagram: 6.4,
  facebook: 2.1,
  linkedin: 3.8,
  tiktok: 9.2,
  youtube: 4.5,
  x: 1.9,
}

export const PLATFORM_PERFORMANCE: PlatformPerformance[] = SOCIAL_ACCOUNTS.map((account) => ({
  platform: account.platform,
  followers: account.followers,
  reach: Math.round(account.followers * (1.4 + (PLATFORM_ENGAGEMENT_RATE[account.platform] ?? 3) / 10)),
  engagementRate: PLATFORM_ENGAGEMENT_RATE[account.platform] ?? 3,
})).sort((a, b) => b.reach - a.reach)

export function getMessagingStats() {
  const total = CONVERSATIONS.length
  const responded = CONVERSATIONS.filter((c) => c.messages.some((m) => m.direction === "outbound")).length
  const responseRate = total === 0 ? 0 : Math.round((responded / total) * 100)

  const gaps: number[] = []
  for (const conv of CONVERSATIONS) {
    const firstInbound = conv.messages.find((m) => m.direction === "inbound")
    const firstOutboundAfter = conv.messages.find(
      (m) => m.direction === "outbound" && firstInbound && new Date(m.sentAt) > new Date(firstInbound.sentAt)
    )
    if (firstInbound && firstOutboundAfter) {
      gaps.push((new Date(firstOutboundAfter.sentAt).getTime() - new Date(firstInbound.sentAt).getTime()) / 60000)
    }
  }
  const avgMinutes = gaps.length === 0 ? 0 : gaps.reduce((a, b) => a + b, 0) / gaps.length
  const responseTimeLabel = avgMinutes < 60 ? `${Math.round(avgMinutes)}m` : `${(avgMinutes / 60).toFixed(1)}h`

  return {
    totalConversations: total,
    unreadConversations: CONVERSATIONS.filter((c) => c.unread).length,
    responseRate,
    responseTimeLabel,
  }
}
