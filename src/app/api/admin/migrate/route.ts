import { NextResponse } from "next/server"
import { runMigrations } from "@/lib/db/migrate"
import { apiError } from "@/lib/api/errors"

/**
 * Token-guarded migration runner, reachable over HTTPS. This host has no
 * available SSH port, so there's no way to `node` a migration script
 * directly on the server — this endpoint is the legitimate alternative:
 * the server-side code already has local network access to Postgres that
 * this laptop does not. Guarded by the same SETUP_TOKEN as /api/setup
 * (both are pre-production bootstrap-only operations); remove SETUP_TOKEN
 * from the production environment once setup is complete to close this off.
 */
export async function POST(request: Request) {
  const expectedToken = process.env.SETUP_TOKEN
  if (!expectedToken) {
    return NextResponse.json({ error: "Migration endpoint is not enabled" }, { status: 403 })
  }
  const providedToken = request.headers.get("x-setup-token")
  if (providedToken !== expectedToken) {
    return NextResponse.json({ error: "Invalid setup token" }, { status: 403 })
  }

  try {
    const result = await runMigrations()
    return NextResponse.json(result)
  } catch (error) {
    return apiError(error, "Migration failed")
  }
}
