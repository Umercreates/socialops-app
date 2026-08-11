"use client"

import { SidebarContent } from "@/components/layout/sidebar-content"
import { useSidebar } from "@/components/layout/sidebar-context"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const { isCollapsed, toggleCollapsed } = useSidebar()

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border transition-[width] duration-200 ease-out lg:block",
        isCollapsed ? "w-(--sidebar-width-collapsed)" : "w-(--sidebar-width)"
      )}
    >
      <SidebarContent collapsed={isCollapsed} onToggleCollapsed={toggleCollapsed} />
    </aside>
  )
}
