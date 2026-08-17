import { Radio, Users, Send, CalendarClock, MessageSquare, MessageCircle, Workflow } from "lucide-react"
import { MetricCard } from "@/components/dashboard/metric-card"
import { SecondaryStatStrip, type SecondaryStat } from "@/components/dashboard/secondary-stat-strip"
import { formatCompactNumber } from "@/lib/format"

interface RealDashboardKpisProps {
  connectedAccounts: number
  totalAccounts: number
  totalFollowers: number
  postsPublished30d: number
  scheduledPosts: number
  newComments7d: number
  whatsappConversations: number
  pendingAutomationTasks: number
}

/** Real-data counterpart to DashboardKpis — every number here comes from
 * this workspace's own DB rows, computed server-side (see
 * getBusinessAnalytics / getSetupProgress). No engagement-rate tile: that
 * would require a provider analytics API this app doesn't integrate yet,
 * so it's surfaced separately as an honest empty state instead of a fake
 * number here. */
export function RealDashboardKpis({
  connectedAccounts,
  totalAccounts,
  totalFollowers,
  postsPublished30d,
  scheduledPosts,
  newComments7d,
  whatsappConversations,
  pendingAutomationTasks,
}: RealDashboardKpisProps) {
  const secondaryStats: SecondaryStat[] = [
    { icon: CalendarClock, label: "Scheduled posts", value: formatCompactNumber(scheduledPosts) },
    { icon: MessageSquare, label: "New comments (7d)", value: formatCompactNumber(newComments7d) },
    { icon: MessageCircle, label: "WhatsApp conversations", value: formatCompactNumber(whatsappConversations) },
    { icon: Workflow, label: "Pending automations", value: formatCompactNumber(pendingAutomationTasks) },
  ]

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={Radio}
          label="Connected accounts"
          value={`${connectedAccounts}/${totalAccounts || connectedAccounts}`}
          caption="Social platforms linked"
        />
        <MetricCard
          icon={Users}
          label="Total followers"
          value={formatCompactNumber(totalFollowers)}
          caption="Across connected accounts"
        />
        <MetricCard
          icon={Send}
          label="Posts published"
          value={formatCompactNumber(postsPublished30d)}
          caption="Last 30 days"
        />
      </div>

      <SecondaryStatStrip stats={secondaryStats} />
    </>
  )
}
