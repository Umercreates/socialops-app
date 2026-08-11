"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { SidebarNavLink } from "@/components/layout/sidebar-nav-link"
import { UserMenu } from "@/components/layout/user-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PRIMARY_NAV, SETTINGS_NAV_ITEM } from "@/lib/nav-config"
import { cn } from "@/lib/utils"

interface SidebarContentProps {
  collapsed?: boolean
  onToggleCollapsed?: () => void
  onNavigate?: () => void
  /** Mobile drawer never collapses — the toggle button is desktop-only. */
  showCollapseToggle?: boolean
}

export function SidebarContent({
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
  showCollapseToggle = true,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-(--header-height) shrink-0 items-center px-4", collapsed && "justify-center px-0")}>
        <Logo markOnly={collapsed} />
        {!collapsed && showCollapseToggle && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="ml-auto flex size-7 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <nav className={cn("flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-2", collapsed && "px-2")}>
        {PRIMARY_NAV.map((item) => (
          <SidebarNavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className={cn("flex flex-col gap-0.5 border-t border-sidebar-border px-2.5 py-2.5", collapsed && "px-2")}>
        {collapsed && showCollapseToggle && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  className="flex h-9 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  aria-label="Expand sidebar"
                />
              }
            >
              <PanelLeftOpen className="size-4" strokeWidth={1.75} />
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        )}
        <SidebarNavLink item={SETTINGS_NAV_ITEM} collapsed={collapsed} onNavigate={onNavigate} />
        <div className={cn("mt-1.5 border-t border-sidebar-border pt-1.5", collapsed && "flex justify-center")}>
          <UserMenu variant={collapsed ? "header" : "sidebar"} />
        </div>
      </div>
    </div>
  )
}
