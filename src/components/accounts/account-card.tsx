"use client"

import Link from "next/link"
import { Unplug, Settings2, PlugZap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { HEALTH_TONE, HEALTH_LABEL } from "@/lib/health"
import { formatCompactNumber, formatRelativeTime } from "@/lib/format"
import type { SocialAccount } from "@/types"

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso))
}

interface AccountCardProps {
  account: SocialAccount
  now: Date
  canManage: boolean
  onDisconnect: (id: string) => void
}

/** Accounts are only ever created by a real OAuth connect-and-discover flow
 * in Integrations - there is no "type in a handle" connect action here
 * anymore, since that can never be more than a fake account with invented
 * follower counts. Every action on this card that would require live
 * provider data (reconnect, sync) routes to Integrations rather than
 * faking a result locally. */
export function AccountCard({ account, now, canManage, onDisconnect }: AccountCardProps) {
  if (account.health === "disconnected") {
    return (
      <Card className="items-center gap-3 border-dashed px-5 py-6 text-center ring-0 outline-2 outline-dashed outline-border">
        <span className="flex size-11 items-center justify-center rounded-full bg-muted">
          <PlatformIcon platform={account.platform} size={20} className="text-muted-foreground" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{PLATFORM_LABEL[account.platform]}</span>
          <span className="text-xs text-muted-foreground">Not connected</span>
        </div>
        {canManage && (
          <Button size="sm" variant="outline" className="mt-1" render={<Link href="/dashboard/integrations" />} nativeButton={false}>
            <PlugZap />
            Connect
          </Button>
        )}
      </Card>
    )
  }

  const needsReconnect = account.health === "expired" || account.health === "attention"

  return (
    <Card className="gap-4 px-5 py-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-muted ring-1 ring-border">
            <PlatformIcon platform={account.platform} accent size={18} />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{account.displayName}</span>
            <span className="text-xs text-muted-foreground">{account.handle}</span>
          </div>
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Account settings"
                />
              }
            >
              <Settings2 className="size-4" strokeWidth={1.75} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="px-1.5 py-1">Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Link href="/dashboard/integrations" className="flex flex-col gap-0.5 rounded-md px-1.5 py-1.5 hover:bg-muted">
                  <span className="text-sm text-foreground">Manage in Integrations</span>
                  <span className="text-xs text-muted-foreground">Credentials, webhook, and readiness live there</span>
                </Link>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <StatusBadge tone={HEALTH_TONE[account.health]} className="w-fit">
        {HEALTH_LABEL[account.health]}
      </StatusBadge>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Followers</span>
          <span className="text-sm font-medium tabular-nums text-foreground">{formatCompactNumber(account.followers)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Connected</span>
          <span className="text-sm font-medium text-foreground">{account.connectedAt ? formatDate(account.connectedAt) : "—"}</span>
        </div>
        <div className="col-span-2 flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Last sync</span>
          <span className="text-sm font-medium text-foreground">
            {account.lastSyncAt ? formatRelativeTime(account.lastSyncAt, now) : "—"}
          </span>
        </div>
      </div>

      {canManage && (
        <div className="flex items-center gap-2 border-t border-border pt-3.5">
          {needsReconnect ? (
            <Button size="sm" className="flex-1" render={<Link href="/dashboard/integrations" />} nativeButton={false}>
              <PlugZap />
              Reconnect
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="flex-1" render={<Link href="/dashboard/integrations" />} nativeButton={false}>
              <Settings2 />
              Manage
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => onDisconnect(account.id)}>
            <Unplug />
            Disconnect
          </Button>
        </div>
      )}
    </Card>
  )
}
