import { connection } from "next/server"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

/**
 * Deliberately cheap (besides the request-time `connection()` gate and a
 * single cookie read): this layout wraps every /dashboard/** page, so
 * anything awaited here blocks first paint on every single dashboard
 * route. Notifications used to be fetched here (auth + DB read) before
 * anything could render - they now load client-side in NotificationPanel
 * instead, off the critical path. Auth itself isn't re-checked here
 * either: the proxy middleware already gates every /dashboard/** request
 * on a valid session, and every page/API route re-verifies independently
 * for its own data anyway (see requireAuth in src/lib/auth/guard.ts) - a
 * third check here added a redundant DB round trip to every page load
 * without adding security.
 *
 * crmMode/demoMode are now DERIVED from the user's dashboard view mode
 * (a cookie, see src/lib/dashboard-view-mode.ts) instead of read directly
 * from CRM_MODE/DEMO_MODE - those env vars stay exactly as configured in
 * production; this only changes where the two flags every existing page
 * already branches on get their value from.
 */
export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  // Forces this read to happen at request time — see app/layout.tsx for why.
  await connection()
  const viewMode = await getDashboardViewMode()
  const crmMode = viewMode === "client" ? "database" : "demo"
  const demoMode = viewMode === "demo"

  return (
    <DashboardShell crmMode={crmMode} demoMode={demoMode} viewMode={viewMode}>
      {children}
    </DashboardShell>
  )
}
