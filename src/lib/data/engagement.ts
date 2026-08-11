import type { AnalyticsMetric, DateRangeOption, EngagementTotals } from "@/types"
import { createSeededRandom } from "./random"

const HOUR_LABELS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"]
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** Relative hourly weight so "today" reads like a real activity curve. */
const HOUR_WEIGHTS = [0.35, 0.2, 0.25, 0.75, 1, 1.15, 1.3, 0.9]
/** Relative weekday weight — weekends dip slightly for a B2B-leaning brand. */
const WEEKDAY_WEIGHTS = [1.05, 1.1, 1.15, 1.1, 1.2, 0.8, 0.75]

interface DailyBase {
  likes: number
  comments: number
  shares: number
  views: number
  reach: number
}

const DAILY_BASE: DailyBase = {
  likes: 2450,
  comments: 175,
  shares: 118,
  views: 29800,
  reach: 47500,
}

/** Each metric grows and wobbles at its own pace so the five totals don't
 * move in lockstep — shares lag views, comments spike more, and so on. */
const METRIC_PROFILE: Record<keyof DailyBase, { trendGrowth: number; noiseSpread: number }> = {
  likes: { trendGrowth: 0.22, noiseSpread: 0.3 },
  comments: { trendGrowth: 0.12, noiseSpread: 0.45 },
  shares: { trendGrowth: 0.3, noiseSpread: 0.5 },
  views: { trendGrowth: 0.18, noiseSpread: 0.24 },
  reach: { trendGrowth: 0.15, noiseSpread: 0.22 },
}

function buildSeries(range: DateRangeOption): AnalyticsMetric[] {
  const rand = createSeededRandom(range === "today" ? 11 : range === "7d" ? 42 : range === "30d" ? 97 : 133)
  const points = range === "today" ? 8 : range === "7d" ? 7 : range === "30d" ? 30 : 90
  const isFlat = range === "today"

  return Array.from({ length: points }, (_, i) => {
    const t = points <= 1 ? 0 : i / (points - 1)

    let weight = 1
    let label: string

    if (range === "today") {
      weight = HOUR_WEIGHTS[i]
      label = HOUR_LABELS[i]
    } else if (range === "7d") {
      weight = WEEKDAY_WEIGHTS[i % 7]
      label = WEEKDAY_LABELS[i % 7]
    } else {
      weight = WEEKDAY_WEIGHTS[i % 7]
      const dayOffset = points - 1 - i
      label = dayOffset === 0 ? "Today" : `${dayOffset}d`
    }

    const scale = range === "today" ? 1 / 8 : 1

    const point = { date: label } as AnalyticsMetric
    for (const key of Object.keys(DAILY_BASE) as (keyof DailyBase)[]) {
      const profile = METRIC_PROFILE[key]
      const trend = isFlat ? 1 : 1 + profile.trendGrowth * t
      const noise = 1 - profile.noiseSpread / 2 + rand() * profile.noiseSpread
      point[key] = Math.round(DAILY_BASE[key] * scale * weight * trend * noise)
    }
    return point
  })
}

export const ENGAGEMENT_SERIES: Record<DateRangeOption, AnalyticsMetric[]> = {
  today: buildSeries("today"),
  "7d": buildSeries("7d"),
  "30d": buildSeries("30d"),
  "90d": buildSeries("90d"),
}

function sum(series: AnalyticsMetric[], key: keyof DailyBase) {
  return series.reduce((acc, point) => acc + point[key], 0)
}

function periodDelta(series: AnalyticsMetric[], key: keyof DailyBase) {
  if (series.length < 4) {
    const [first, last] = [series[0][key], series[series.length - 1][key]]
    return first === 0 ? 0 : ((last - first) / first) * 100
  }
  const mid = Math.floor(series.length / 2)
  const firstHalf = series.slice(0, mid)
  const secondHalf = series.slice(mid)
  const firstAvg = sum(firstHalf, key) / firstHalf.length
  const secondAvg = sum(secondHalf, key) / secondHalf.length
  return firstAvg === 0 ? 0 : ((secondAvg - firstAvg) / firstAvg) * 100
}

export function getEngagementTotals(range: DateRangeOption): EngagementTotals {
  const series = ENGAGEMENT_SERIES[range]
  return {
    engagements: sum(series, "likes") + sum(series, "comments") + sum(series, "shares"),
    engagementsDelta: getTotalEngagementsDelta(range),
    likes: sum(series, "likes"),
    comments: sum(series, "comments"),
    shares: sum(series, "shares"),
    views: sum(series, "views"),
    reach: sum(series, "reach"),
    likesDelta: Math.round(periodDelta(series, "likes") * 10) / 10,
    commentsDelta: Math.round(periodDelta(series, "comments") * 10) / 10,
    sharesDelta: Math.round(periodDelta(series, "shares") * 10) / 10,
    viewsDelta: Math.round(periodDelta(series, "views") * 10) / 10,
    reachDelta: Math.round(periodDelta(series, "reach") * 10) / 10,
  }
}

function engagementRateFor(series: AnalyticsMetric[]): number {
  const interactions = sum(series, "likes") + sum(series, "comments") + sum(series, "shares")
  const reach = sum(series, "reach")
  return reach === 0 ? 0 : (interactions / reach) * 100
}

export function getEngagementRate(range: DateRangeOption): number {
  return Math.round(engagementRateFor(ENGAGEMENT_SERIES[range]) * 10) / 10
}

export function getEngagementRateDelta(range: DateRangeOption): number {
  const series = ENGAGEMENT_SERIES[range]
  const mid = Math.floor(series.length / 2)
  const delta = engagementRateFor(series.slice(mid)) - engagementRateFor(series.slice(0, mid))
  return Math.round(delta * 10) / 10
}

function totalEngagementsFor(point: AnalyticsMetric) {
  return point.likes + point.comments + point.shares
}

/** Per-point total engagements (likes + comments + shares) — the single
 * series the engagement chart plots, so it never mixes metrics of very
 * different scale (e.g. likes vs. views) on one axis. */
export function getTotalEngagementsSeries(range: DateRangeOption) {
  return ENGAGEMENT_SERIES[range].map((point) => ({ date: point.date, value: totalEngagementsFor(point) }))
}

export function getTotalEngagementsDelta(range: DateRangeOption): number {
  const series = ENGAGEMENT_SERIES[range]
  const mid = Math.floor(series.length / 2)
  const firstHalf = series.slice(0, mid)
  const secondHalf = series.slice(mid)
  const firstAvg = firstHalf.reduce((acc, p) => acc + totalEngagementsFor(p), 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((acc, p) => acc + totalEngagementsFor(p), 0) / secondHalf.length
  return firstAvg === 0 ? 0 : Math.round(((secondAvg - firstAvg) / firstAvg) * 1000) / 10
}
