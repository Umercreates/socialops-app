import { cookies } from "next/headers"

/**
 * The user-facing DEMO/CLIENT toggle - a RUNTIME preference, not the
 * deployment-level CRM_MODE/DEMO_MODE env vars. Those stay exactly as
 * they are (CRM_MODE=database, DEMO_MODE=false in production) and are
 * never touched by this. This is a separate, per-user, cookie-backed
 * value layered on top: when real infrastructure exists (CRM_MODE=
 * database), the cookie decides whether THIS user is currently looking
 * at the demo workspace or their real one. When no real infrastructure
 * exists at all, there is nothing to switch to, so it's always demo.
 *
 * This is a preference, not an authorization boundary - it never changes
 * what a user is allowed to see or do, only which dataset they're
 * looking at. Every dangerous real-execution entry point additionally
 * enforces this server-side via requireClientMode() (see
 * src/lib/auth/dashboard-mode-guard.ts) so a demo-mode request can never
 * reach a real side effect, regardless of what the UI shows.
 */
export const DASHBOARD_MODE_COOKIE = "easylife_dashboard_mode"

export type DashboardViewMode = "demo" | "client"

/** Whether this deployment has real backing infrastructure at all - the
 * existing, unchanged CRM_MODE flag. When false, "client mode" has
 * nothing real to show, so the view mode is always demo regardless of
 * the cookie. */
export function hasRealBackend(): boolean {
  return process.env.CRM_MODE === "database"
}

/** Reads the current user's dashboard view mode. Defaults to "client"
 * for production users per product requirement - a client only sees the
 * demo workspace if they explicitly switch to it. */
export async function getDashboardViewMode(): Promise<DashboardViewMode> {
  if (!hasRealBackend()) return "demo"
  const store = await cookies()
  const raw = store.get(DASHBOARD_MODE_COOKIE)?.value
  return raw === "demo" ? "demo" : "client"
}

/** The existing crmMode/demoMode values every page.tsx and MockDataProvider
 * already branch on - now derived from the view mode instead of the env
 * vars directly, so every existing branch point picks this up for free. */
export async function getLegacyModeFlags(): Promise<{ crmMode: "demo" | "database"; demoMode: boolean }> {
  const viewMode = await getDashboardViewMode()
  return {
    crmMode: viewMode === "client" ? "database" : "demo",
    demoMode: viewMode === "demo",
  }
}
