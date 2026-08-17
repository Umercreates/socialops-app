"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Plus, Radio } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SearchTrigger } from "@/components/layout/search-trigger"
import { NotificationPanel } from "@/components/layout/notification-panel"
import { UserMenu } from "@/components/layout/user-menu"
import { useSidebar } from "@/components/layout/sidebar-context"
import { useSocialAccounts } from "@/lib/store/accounts-store"
import { ALL_NAV_ITEMS } from "@/lib/nav-config"

function useActiveSectionTitle() {
  const pathname = usePathname()
  if (pathname === "/dashboard") return "Dashboard"
  const match = ALL_NAV_ITEMS.filter((item) => item.href !== "/dashboard" && pathname.startsWith(item.href)).sort(
    (a, b) => b.href.length - a.href.length
  )[0]
  return match?.title ?? "Dashboard"
}

export function AppHeader() {
  const { setIsMobileOpen } = useSidebar()
  const sectionTitle = useActiveSectionTitle()
  const { accounts } = useSocialAccounts()
  const connectedAccounts = accounts.filter((a) => a.health !== "disconnected").length

  return (
    <header className="sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-4.5" strokeWidth={1.75} />
      </button>

      <h1 className="truncate text-[15px] font-medium text-foreground">{sectionTitle}</h1>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <SearchTrigger />

        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/dashboard/accounts"
                prefetch={false}
                className="hidden h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground hover:border-ring/50 hover:text-foreground md:flex"
              />
            }
          >
            <Radio className="size-3.5 text-success" strokeWidth={1.75} />
            {connectedAccounts}/{accounts.length} connected
          </TooltipTrigger>
          <TooltipContent side="bottom">Manage social accounts</TooltipContent>
        </Tooltip>

        <Button
          render={<Link href="/dashboard/create" prefetch={false} />}
          nativeButton={false}
          size="sm"
          className="hidden sm:inline-flex"
        >
          <Plus />
          Create
        </Button>
        <Button
          render={<Link href="/dashboard/create" prefetch={false} />}
          nativeButton={false}
          size="icon-sm"
          className="sm:hidden"
          aria-label="Create"
        >
          <Plus />
        </Button>

        <NotificationPanel />

        {/* Desktop shows the account menu in the sidebar footer; the header
         * only needs it while that sidebar is a closed mobile drawer. */}
        <div className="ml-1 lg:hidden">
          <UserMenu variant="header" />
        </div>
      </div>
    </header>
  )
}
