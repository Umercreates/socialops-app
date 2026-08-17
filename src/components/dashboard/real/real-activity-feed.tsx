import { CircleCheck, CircleX, MessageCircle, MessageSquare, UserPlus, Workflow, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlatformIcon } from "@/components/dashboard/platform-icon"
import { formatRelativeTime } from "@/lib/format"
import type { ActivityItem } from "@/types"
import { cn } from "@/lib/utils"

const TYPE_ICON: Record<ActivityItem["type"], LucideIcon> = {
  "post-published": CircleCheck,
  "message-received": MessageCircle,
  "account-connected": UserPlus,
  "comment-received": MessageSquare,
  "automation-run": Workflow,
  "post-failed": CircleX,
}

const STATUS_TONE: Record<ActivityItem["status"], string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground dark:text-warning",
  error: "bg-destructive/10 text-destructive",
  info: "bg-brand/10 text-brand",
}

/** Same presentation as ActivityFeed, but measures "how long ago" against
 * the real current time instead of the demo's fixed MOCK_NOW - real events
 * have real timestamps and would show nonsensical relative times otherwise. */
export function RealActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="gap-3 px-4 py-4 sm:px-5 sm:py-5">
      <CardHeader className="px-0">
        <CardTitle className="text-[15px]">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col px-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-sm text-muted-foreground">Nothing has happened yet.</p>
          </div>
        ) : (
          items.map((item, index) => {
            const Icon = TYPE_ICON[item.type]
            return (
              <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", STATUS_TONE[item.status])}>
                    <Icon className="size-3.5" strokeWidth={1.75} />
                  </span>
                  {index < items.length - 1 && <span className="w-px flex-1 bg-border" aria-hidden="true" />}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 pb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                    {item.platform && <PlatformIcon platform={item.platform} size={13} className="text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <span className="text-[11px] text-muted-foreground/70">{formatRelativeTime(item.timestamp, new Date())}</span>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
