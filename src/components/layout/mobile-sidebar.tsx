"use client"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { SidebarContent } from "@/components/layout/sidebar-content"
import { useSidebar } from "@/components/layout/sidebar-context"

export function MobileSidebar() {
  const { isMobileOpen, setIsMobileOpen } = useSidebar()

  return (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <SheetContent side="left" className="w-72 p-0 sm:max-w-none" showCloseButton={false}>
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarContent showCollapseToggle={false} onNavigate={() => setIsMobileOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
