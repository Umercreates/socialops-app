import { connection } from "next/server"
import { DashboardShell } from "@/components/layout/dashboard-shell"

/**
 * Deliberately synchronous (besides the request-time `connection()` gate):
 * this layout wraps every /dashboard/** page, so anything awaited here
 * blocks first paint on every single dashboard route. Notifications used
 * to be fetched here (auth + DB read) before anything could render - they
 * now load client-side in NotificationPanel instead, off the critical
 * path. Auth itself isn't re-checked here either: the proxy middleware
 * already gates every /dashboard/** request on a valid session, and every
 * page/API route re-verifies independently for its own data anyway (see
 * requireAuth in src/lib/auth/guard.ts) - a third check here added a
 * redundant DB round trip to every page load without adding security.
 */
export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  // Forces this read to happen at request time — see app/layout.tsx for why.
  await connection()
  const crmMode = process.env.CRM_MODE === "database" ? "database" : "demo"
  const demoMode = process.env.DEMO_MODE !== "false"

  return (
    <DashboardShell crmMode={crmMode} demoMode={demoMode}>
      {children}
    </DashboardShell>
  )
}
