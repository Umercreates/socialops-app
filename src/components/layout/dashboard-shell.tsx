"use client"

import { SidebarProvider } from "@/components/layout/sidebar-context"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { MockDataProvider } from "@/lib/store/mock-data-provider"
import { DemoModeProvider } from "@/lib/demo-mode-context"

interface DashboardShellProps {
  children: React.ReactNode
  crmMode?: "demo" | "database"
  demoMode?: boolean
}

export function DashboardShell({ children, crmMode = "demo", demoMode = true }: DashboardShellProps) {
  return (
    <DemoModeProvider demoMode={demoMode}>
      <MockDataProvider crmMode={crmMode}>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <MobileSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <AppHeader />
              <main className="flex flex-1 flex-col">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </MockDataProvider>
    </DemoModeProvider>
  )
}
