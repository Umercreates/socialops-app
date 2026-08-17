import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

/** Honest replacement for the old fabricated engagement chart. No social
 * platform's own analytics API is integrated yet, so likes/comments/shares/
 * reach/views have no real source — showing invented numbers here would be
 * exactly the kind of fake analytics this dashboard must not ship. */
export function NoProviderAnalyticsCard() {
  return (
    <Card className="gap-4 px-4 py-4 sm:px-5 sm:py-5">
      <CardHeader className="px-0">
        <CardTitle className="text-[15px]">Engagement overview</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <BarChart3 className="size-5 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No provider analytics data available yet.</p>
          <p className="max-w-sm text-xs text-muted-foreground/80">
            Engagement metrics (likes, comments, shares, reach) come directly from each platform&apos;s analytics
            API. Connect a provider in Integrations to start seeing real numbers here.
          </p>
          <Link href="/dashboard/integrations" prefetch={false} className="mt-1 text-xs font-medium text-brand hover:underline">
            Go to Integrations
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
