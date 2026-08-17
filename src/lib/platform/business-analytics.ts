import { and, desc, eq, gte, sql } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { leads, calls, meetings, posts, postTargets, automations, automationRuns, whatsappConversations, whatsappMessages, socialAccounts, integrationConnections, comments } from "@/lib/db/schema"
import type { ActivityItem, SocialPlatform } from "@/types"

/**
 * Real EasyLife business analytics, computed directly from this
 * workspace's own data - no external provider metrics here (those only
 * exist once a provider's own analytics API is actually integrated,
 * which none currently are; callers should show a "Connect provider /
 * No provider data" empty state for engagement-style metrics instead).
 */

export interface CountBucket {
  key: string
  count: number
}

export interface BusinessAnalyticsOverview {
  leads: {
    total: number
    newLast30d: number
    bySource: CountBucket[]
    byStage: CountBucket[]
    qualified: number
    won: number
    lost: number
  }
  calls: { total: number; completed: number; failed: number; blocked: number }
  meetings: { total: number; scheduled: number; completed: number; cancelled: number; failed: number }
  posts: { total: number; published: number; failed: number; partiallyFailed: number; scheduled: number; draft: number }
  postTargets: { total: number; published: number; failed: number; blocked: number }
  automationRuns: { total: number; completed: number; blocked: number; failed: number; pendingApproval: number }
  conversations: { total: number }
  comments: { total: number; newLast7d: number; open: number }
}

/** Computes 8 workspace tables' worth of dashboard/analytics aggregates in
 * ONE parallel batch (10 queries total, down from 21 across 8 sequential
 * round trips in an earlier version). Every "total" is derived by summing
 * its own status/stage breakdown in JS instead of a separate COUNT(*) -
 * `stage`/`status` are NOT NULL columns, so a GROUP BY on them already
 * partitions every row exactly once; summing it is exact, not an
 * approximation. Same reasoning eliminated leads' separate qualified/won/
 * lost counts - those are just specific rows already present in the
 * `byStage` breakdown. Comments' three counts (total/new7d/open) use
 * conditional aggregation (COUNT(*) FILTER) instead of three separate
 * queries, since they don't share a common GROUP BY key. */
export async function getBusinessAnalytics(workspaceId: string): Promise<BusinessAnalyticsOverview> {
  return withDb(async (db) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [leadNew30d, leadBySource, leadByStage, callByStatus, meetingByStatus, postByStatus, targetByStatus, runByStatus, conversationTotal, commentCounts] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(leads).where(and(eq(leads.workspaceId, workspaceId), gte(leads.createdAt, thirtyDaysAgo))),
        db.select({ key: leads.sourcePlatform, count: sql<number>`count(*)` }).from(leads).where(eq(leads.workspaceId, workspaceId)).groupBy(leads.sourcePlatform),
        db.select({ key: leads.stage, count: sql<number>`count(*)` }).from(leads).where(eq(leads.workspaceId, workspaceId)).groupBy(leads.stage),
        db.select({ key: calls.status, count: sql<number>`count(*)` }).from(calls).where(eq(calls.workspaceId, workspaceId)).groupBy(calls.status),
        db.select({ key: meetings.status, count: sql<number>`count(*)` }).from(meetings).where(eq(meetings.workspaceId, workspaceId)).groupBy(meetings.status),
        db.select({ key: posts.status, count: sql<number>`count(*)` }).from(posts).where(eq(posts.workspaceId, workspaceId)).groupBy(posts.status),
        db.select({ key: postTargets.status, count: sql<number>`count(*)` }).from(postTargets).where(eq(postTargets.workspaceId, workspaceId)).groupBy(postTargets.status),
        db.select({ key: automationRuns.status, count: sql<number>`count(*)` }).from(automationRuns).where(eq(automationRuns.workspaceId, workspaceId)).groupBy(automationRuns.status),
        db.select({ count: sql<number>`count(*)` }).from(whatsappConversations).where(eq(whatsappConversations.workspaceId, workspaceId)),
        db
          .select({
            total: sql<number>`count(*)`,
            newLast7d: sql<number>`count(*) filter (where ${comments.createdAt} >= ${sevenDaysAgo})`,
            open: sql<number>`count(*) filter (where ${comments.status} = 'open')`,
          })
          .from(comments)
          .where(eq(comments.workspaceId, workspaceId)),
      ])

    const bucket = (rows: { key: string; count: number }[], key: string) => Number(rows.find((r) => r.key === key)?.count ?? 0)
    const sumCounts = (rows: { count: number }[]) => rows.reduce((total, r) => total + Number(r.count), 0)

    return {
      leads: {
        total: sumCounts(leadByStage),
        newLast30d: Number(leadNew30d[0]?.count ?? 0),
        bySource: leadBySource.map((r) => ({ key: r.key, count: Number(r.count) })),
        byStage: leadByStage.map((r) => ({ key: r.key, count: Number(r.count) })),
        qualified: bucket(leadByStage, "qualified"),
        won: bucket(leadByStage, "won"),
        lost: bucket(leadByStage, "lost"),
      },
      calls: {
        total: sumCounts(callByStatus),
        completed: bucket(callByStatus, "completed"),
        failed: bucket(callByStatus, "failed"),
        blocked: bucket(callByStatus, "blocked"),
      },
      meetings: {
        total: sumCounts(meetingByStatus),
        scheduled: bucket(meetingByStatus, "scheduled"),
        completed: bucket(meetingByStatus, "completed"),
        cancelled: bucket(meetingByStatus, "cancelled"),
        failed: bucket(meetingByStatus, "failed"),
      },
      posts: {
        total: sumCounts(postByStatus),
        published: bucket(postByStatus, "published"),
        failed: bucket(postByStatus, "failed"),
        partiallyFailed: bucket(postByStatus, "partially_failed"),
        scheduled: bucket(postByStatus, "scheduled"),
        draft: bucket(postByStatus, "draft"),
      },
      postTargets: {
        total: sumCounts(targetByStatus),
        published: bucket(targetByStatus, "published"),
        failed: bucket(targetByStatus, "failed"),
        blocked: bucket(targetByStatus, "blocked"),
      },
      automationRuns: {
        total: sumCounts(runByStatus),
        completed: bucket(runByStatus, "completed"),
        blocked: bucket(runByStatus, "blocked"),
        failed: bucket(runByStatus, "failed"),
        pendingApproval: bucket(runByStatus, "pending-approval"),
      },
      conversations: { total: Number(conversationTotal[0]?.count ?? 0) },
      comments: {
        total: Number(commentCounts[0]?.total ?? 0),
        newLast7d: Number(commentCounts[0]?.newLast7d ?? 0),
        open: Number(commentCounts[0]?.open ?? 0),
      },
    }
  })
}

export interface SetupProgress {
  configuredProviders: number
  totalProviders: number
  hasLiveProvider: boolean
  liveProviderIds: string[]
}

/** How many of this workspace's real integration_connections rows have
 * actually reached mode="live" - the same, single source of truth every
 * other "is this provider really ready" check in this app already uses. */
export async function getSetupProgress(workspaceId: string, totalProviders: number): Promise<SetupProgress> {
  return withDb(async (db) => {
    const rows = await db
      .select({ provider: integrationConnections.provider })
      .from(integrationConnections)
      .where(and(eq(integrationConnections.workspaceId, workspaceId), eq(integrationConnections.mode, "live")))
    return {
      configuredProviders: rows.length,
      totalProviders,
      hasLiveProvider: rows.length > 0,
      liveProviderIds: rows.map((r) => r.provider),
    }
  })
}

export async function getConnectedAccountCount(workspaceId: string): Promise<number> {
  return withDb(async (db) => {
    const rows = await db.select({ count: sql<number>`count(*)` }).from(socialAccounts).where(eq(socialAccounts.workspaceId, workspaceId))
    return Number(rows[0]?.count ?? 0)
  })
}

/** Merges recent events from posts, automation runs, and newly-connected
 * accounts into a single timeline - the real equivalent of the old fake
 * activity feed. Comment/message events are intentionally left out until
 * comment ingestion and inbox sources are real (see comments platform
 * module) rather than backfilling them with data that doesn't exist yet. */
export async function getRecentActivity(workspaceId: string, limit = 6): Promise<ActivityItem[]> {
  return withDb(async (db) => {
    const [recentPosts, recentRuns, recentAccounts] = await Promise.all([
      db
        .select({ id: posts.id, title: posts.title, status: posts.status, platforms: posts.platforms, updatedAt: posts.updatedAt })
        .from(posts)
        .where(and(eq(posts.workspaceId, workspaceId), sql`${posts.status} in ('published', 'failed', 'partially_failed')`))
        .orderBy(desc(posts.updatedAt))
        .limit(limit),
      db
        .select({ id: automationRuns.id, status: automationRuns.status, startedAt: automationRuns.startedAt, automationName: automations.name })
        .from(automationRuns)
        .innerJoin(automations, eq(automationRuns.automationId, automations.id))
        .where(eq(automationRuns.workspaceId, workspaceId))
        .orderBy(desc(automationRuns.startedAt))
        .limit(limit),
      db
        .select({ id: socialAccounts.id, provider: socialAccounts.provider, accountName: socialAccounts.accountName, connectedAt: socialAccounts.connectedAt })
        .from(socialAccounts)
        .where(and(eq(socialAccounts.workspaceId, workspaceId), sql`${socialAccounts.connectedAt} is not null`))
        .orderBy(desc(socialAccounts.connectedAt))
        .limit(limit),
    ])

    const items: ActivityItem[] = [
      ...recentPosts.map((p) => ({
        id: `post_${p.id}`,
        type: p.status === "published" ? ("post-published" as const) : ("post-failed" as const),
        status: p.status === "published" ? ("success" as const) : ("error" as const),
        platform: (p.platforms as SocialPlatform[])[0],
        title: p.status === "published" ? "Post published" : "Post failed to publish",
        description: p.title || "Untitled post",
        timestamp: p.updatedAt.toISOString(),
      })),
      ...recentRuns.map((r) => ({
        id: `run_${r.id}`,
        type: "automation-run" as const,
        status: r.status === "completed" ? ("success" as const) : r.status === "blocked" ? ("warning" as const) : ("error" as const),
        title: `Automation ${r.status}`,
        description: r.automationName,
        timestamp: r.startedAt.toISOString(),
      })),
      ...recentAccounts.map((a) => ({
        id: `acct_${a.id}`,
        type: "account-connected" as const,
        status: "info" as const,
        platform: a.provider as SocialPlatform,
        title: "Account connected",
        description: a.accountName,
        timestamp: (a.connectedAt as Date).toISOString(),
      })),
    ]

    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit)
  })
}

export interface MessagingAnalytics {
  totalConversations: number
  respondedConversations: number
  responseRate: number
  avgResponseMinutes: number | null
}

/** Real response-rate / response-time analytics computed from actual
 * whatsapp_messages rows - replaces the old seeded-random "messaging
 * stats". Bounded to the last 90 days / 5000 messages so this stays cheap
 * as a workspace's message history grows; that's a large enough sample to
 * be representative without needing a materialized rollup table yet. */
export async function getMessagingAnalytics(workspaceId: string): Promise<MessagingAnalytics> {
  return withDb(async (db) => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const rows = await db
      .select({ conversationId: whatsappMessages.conversationId, direction: whatsappMessages.direction, createdAt: whatsappMessages.createdAt })
      .from(whatsappMessages)
      .where(and(eq(whatsappMessages.workspaceId, workspaceId), gte(whatsappMessages.createdAt, ninetyDaysAgo)))
      .orderBy(whatsappMessages.createdAt)
      .limit(5000)

    const byConversation = new Map<string, { direction: string; createdAt: Date }[]>()
    for (const row of rows) {
      const list = byConversation.get(row.conversationId) ?? []
      list.push(row)
      byConversation.set(row.conversationId, list)
    }

    let responded = 0
    const responseMinutes: number[] = []
    for (const messages of byConversation.values()) {
      const firstInbound = messages.find((m) => m.direction === "inbound")
      if (!firstInbound) continue
      const firstReply = messages.find((m) => m.direction === "outbound" && m.createdAt > firstInbound.createdAt)
      if (firstReply) {
        responded += 1
        responseMinutes.push((firstReply.createdAt.getTime() - firstInbound.createdAt.getTime()) / 60000)
      }
    }

    const conversationsWithInbound = [...byConversation.values()].filter((m) => m.some((x) => x.direction === "inbound")).length
    const avgResponseMinutes = responseMinutes.length > 0 ? Math.round(responseMinutes.reduce((a, b) => a + b, 0) / responseMinutes.length) : null

    return {
      totalConversations: byConversation.size,
      respondedConversations: responded,
      responseRate: conversationsWithInbound === 0 ? 0 : Math.round((responded / conversationsWithInbound) * 100),
      avgResponseMinutes,
    }
  })
}

export interface PlatformPublishPerformance {
  platform: string
  published: number
  failed: number
  blocked: number
  total: number
  successRate: number
}

/** Real per-platform publish performance from post_targets - each
 * platform's own success/failure counts, not a fabricated "reach/likes"
 * number no provider analytics API actually supplies yet. */
export async function getPlatformPublishPerformance(workspaceId: string): Promise<PlatformPublishPerformance[]> {
  return withDb(async (db) => {
    const rows = await db
      .select({ platform: postTargets.provider, status: postTargets.status, count: sql<number>`count(*)` })
      .from(postTargets)
      .where(eq(postTargets.workspaceId, workspaceId))
      .groupBy(postTargets.provider, postTargets.status)

    const byPlatform = new Map<string, { published: number; failed: number; blocked: number }>()
    for (const row of rows) {
      const entry = byPlatform.get(row.platform) ?? { published: 0, failed: 0, blocked: 0 }
      if (row.status === "published") entry.published = Number(row.count)
      else if (row.status === "failed") entry.failed = Number(row.count)
      else if (row.status === "blocked") entry.blocked = Number(row.count)
      byPlatform.set(row.platform, entry)
    }

    return [...byPlatform.entries()].map(([platform, counts]) => {
      const total = counts.published + counts.failed + counts.blocked
      return { platform, ...counts, total, successRate: total === 0 ? 0 : Math.round((counts.published / total) * 100) }
    })
  })
}
