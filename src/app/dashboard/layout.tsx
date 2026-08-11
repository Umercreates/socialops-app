import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getNotifications } from "@/lib/services/dashboard-service"

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const notifications = await getNotifications()

  return <DashboardShell notifications={notifications}>{children}</DashboardShell>
}
