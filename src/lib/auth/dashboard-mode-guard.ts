import { NextResponse } from "next/server"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

/**
 * Central safeguard for every real-provider-touching mutation - publishing,
 * WhatsApp/comment replies, call dispatch, Sheets/Calendar writes,
 * automation execution, integration credential changes. Demo-mode UI never
 * calls these routes in the first place (it operates on in-memory demo
 * stores only), but this is the defense-in-depth backstop: security must
 * not depend only on the frontend hiding a button. Checked from the same
 * cookie getDashboardViewMode() reads - if a request somehow reaches one
 * of these routes while the requester's dashboard is in demo mode, it's
 * rejected before any real side effect, not just before the UI shows it.
 */
export async function requireClientMode(): Promise<NextResponse | null> {
  const mode = await getDashboardViewMode()
  if (mode === "demo") {
    return NextResponse.json(
      { error: "This action isn't available in Demo Mode. Switch to Client Mode to perform real actions." },
      { status: 403 }
    )
  }
  return null
}
