import Link from "next/link"
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { formatCompactNumber, formatSignedCompact } from "@/lib/format"
import { HEALTH_TONE, HEALTH_LABEL } from "@/lib/health"
import { cn } from "@/lib/utils"
import type { SocialAccount } from "@/types"

export function RealAccountSummary({ accounts }: { accounts: SocialAccount[] }) {
  return (
    <Card className="gap-3 px-4 py-4 sm:px-5 sm:py-5">
      <CardHeader className="flex-row items-center justify-between px-0">
        <CardTitle className="text-[15px]">Connected accounts</CardTitle>
        <Link
          href="/dashboard/accounts"
          prefetch={false}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          View all
          <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-0">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-sm text-muted-foreground">No accounts connected yet.</p>
            <Link href="/dashboard/integrations" prefetch={false} className="text-xs font-medium text-brand hover:underline">
              Connect an account
            </Link>
          </div>
        ) : (
          accounts.map((account) => {
            const isPositive = account.followersDelta30d >= 0
            return (
              <div key={account.id} className="flex items-center gap-3 rounded-lg px-1.5 py-2 hover:bg-muted/60">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted ring-1 ring-border">
                  <PlatformIcon platform={account.platform} accent size={17} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">{PLATFORM_LABEL[account.platform]}</span>
                  <span className="truncate text-xs text-muted-foreground">{account.handle}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-sm font-medium tabular-nums text-foreground">{formatCompactNumber(account.followers)}</span>
                  <span className={cn("flex items-center gap-0.5 text-xs tabular-nums", isPositive ? "text-success" : "text-destructive")}>
                    {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {formatSignedCompact(account.followersDelta30d)}
                  </span>
                </div>
                <StatusBadge tone={HEALTH_TONE[account.health]} className="hidden sm:inline-flex">
                  {HEALTH_LABEL[account.health]}
                </StatusBadge>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
