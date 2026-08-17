"use client"

import * as React from "react"

/**
 * Reliable client-side access to the server's real DEMO_MODE value.
 *
 * `src/lib/demo-mode.ts`'s DEMO_MODE constant reads `process.env.DEMO_MODE`
 * directly in a file that gets imported into client components - but
 * Next.js only inlines `NEXT_PUBLIC_*` vars into the browser bundle, so
 * every other `process.env.*` reference reachable from client code gets
 * replaced with `undefined` at build time. A client component importing
 * that constant directly always sees the safe fallback (demo), regardless
 * of the real server value - worse, since these components DO get
 * server-rendered on first load, that mismatches whatever the *server*
 * evaluated, which is a real hydration inconsistency, not just a stale
 * read.
 *
 * This context is populated once, server-side, in dashboard/layout.tsx
 * (same place workspaceMode/crmMode already work this way) and is the
 * only way a client component should ever need to know the real
 * DEMO_MODE value.
 */
const DemoModeContext = React.createContext<boolean>(true)

export function DemoModeProvider({ demoMode, children }: { demoMode: boolean; children: React.ReactNode }) {
  return <DemoModeContext.Provider value={demoMode}>{children}</DemoModeContext.Provider>
}

export function useDemoMode(): boolean {
  return React.useContext(DemoModeContext)
}
