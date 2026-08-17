import { NextResponse } from "next/server"
import { runMigrations } from "@/lib/db/migrate"
import { apiError } from "@/lib/api/errors"

/**
 * Token-guarded migration runner, reachable over HTTPS. This host has no
 * available SSH port, so there's no way to `node` a migration script
 * directly on the server - this endpoint is the legitimate alternative:
 * the server-side code already has local network access to Postgres that
 * this laptop does not.
 *
 * Gated by its own dedicated MIGRATION_TOKEN - deliberately never
 * SETUP_TOKEN. SETUP_TOKEN's whole documented lifecycle is "retire it once
 * the first owner exists"; migrations are an ongoing operational need (new
 * ones ship over time), so coupling the two meant this endpoint would stop
 * working the moment SETUP_TOKEN was correctly retired. MIGRATION_TOKEN has
 * no such retirement - it stays configured for as long as this host has no
 * SSH access.
 *
 * Cannot execute arbitrary SQL: runMigrations() only ever reads and applies
 * migrations/*.sql files already committed to the repo, in filename order,
 * each exactly once (tracked in socialops.schema_migrations) - nothing
 * about the request body or headers reaches the database as SQL. A missing
 * or wrong token gets a plain 404, not a 403, so this endpoint's existence
 * isn't confirmable by probing (same pattern as app.js's cache-purge route).
 */
export async function POST(request: Request) {
  const expectedToken = process.env.MIGRATION_TOKEN
  if (!expectedToken) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const providedToken = request.headers.get("x-migration-token")
  if (providedToken !== expectedToken) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const result = await runMigrations()
    return NextResponse.json(result)
  } catch (error) {
    return apiError(error, "Migration failed")
  }
}
