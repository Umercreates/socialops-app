"use client"

import { SidebarProvider } from "@/components/layout/sidebar-context"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { MockDataProvider } from "@/lib/store/mock-data-provider"
import type { Notification } from "@/types"

interface DashboardShellProps {
  children: React.ReactNode
  notifications: Notification[]
}

export function DashboardShell({ children, notifications }: DashboardShellProps) {
  return (
    <MockDataProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <MobileSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader notifications={notifications} />
            <main className="flex flex-1 flex-col">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </MockDataProvider>
  )
}
