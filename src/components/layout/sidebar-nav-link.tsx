"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { NavItem } from "@/lib/nav-config"

interface SidebarNavLinkProps {
  item: NavItem
  collapsed?: boolean
  onNavigate?: () => void
}

export function SidebarNavLink({ item, collapsed = false, onNavigate }: SidebarNavLinkProps) {
  const pathname = usePathname()
  const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
  const Icon = item.icon

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      prefetch={item.comingSoon ? false : undefined}
      className={cn(
        "group/nav-link relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-all duration-150",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_4px_12px_-2px_rgb(var(--brand-glow)/0.45)]"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0 transition-transform duration-150 group-hover/nav-link:scale-110" strokeWidth={1.75} />
      {!collapsed && <span className="truncate">{item.title}</span>}
      {!collapsed && item.comingSoon && (
        <span className="ml-auto shrink-0 rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/45">
          Soon
        </span>
      )}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">
        {item.title}
        {item.comingSoon ? " · Soon" : ""}
      </TooltipContent>
    </Tooltip>
  )
}
