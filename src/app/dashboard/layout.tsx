import { connection } from "next/server"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getNotifications } from "@/lib/services/dashboard-service"
import { requireAuth } from "@/lib/auth/guard"
import { listNotifications } from "@/lib/platform/notifications"

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  // Forces this read to happen at request time — see app/layout.tsx for why.
  await connection()
  const crmMode = process.env.CRM_MODE === "database" ? "database" : "demo"
  const demoMode = process.env.DEMO_MODE !== "false"

  // The proxy middleware already gates every /dashboard/** request on a
  // valid session, so this should always resolve when CRM_MODE=database -
  // still handled defensively (falls back to the demo feed) rather than
  // ever throwing the whole layout over an edge case here.
  const notifications =
    crmMode === "database"
      ? await requireAuth().then((auth) => (auth.ok ? listNotifications(auth.ctx.workspaceId, auth.ctx.userId) : getNotifications()))
      : await getNotifications()

  return (
    <DashboardShell notifications={notifications} crmMode={crmMode} demoMode={demoMode}>
      {children}
    </DashboardShell>
  )
}
