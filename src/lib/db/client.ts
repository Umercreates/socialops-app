import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from "./schema"

/**
 * Server-only PostgreSQL connection pool + Drizzle client, reused across
 * requests within this Node process (never create a pool per-request).
 *
 * `pg` is pure JS (no native bindings) — deliberately chosen over anything
 * requiring a native binary, since this host's older glibc already broke
 * Next's own native SWC/Turbopack binary once this session.
 *
 * A conservative pool size fits shared hosting: XMart's Postgres almost
 * certainly caps total connections low, and this app runs as a single
 * Node process behind Passenger, not a fleet of workers.
 */

declare global {
  var __easylifePgPool: Pool | undefined
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured")
  }

  const sslEnabled = process.env.DATABASE_SSL === "true"

  return new Pool({
    connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: true } : undefined,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  })
}

/** Reuses a single pool across hot-reloads/requests in the same process. */
export function getPool(): Pool {
  if (!global.__easylifePgPool) {
    global.__easylifePgPool = createPool()
  }
  return global.__easylifePgPool
}

export function getDb() {
  return drizzle(getPool(), { schema })
}

export class DatabaseUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Database is currently unavailable")
    this.name = "DatabaseUnavailableError"
    this.cause = cause
  }
}

/** Wraps a DB operation so connection/query failures become a controlled,
 * safe error instead of an unhandled crash that could take down the whole
 * server process. Callers turn this into a clean 503, never a stack trace. */
export async function withDb<T>(fn: (db: ReturnType<typeof getDb>) => Promise<T>): Promise<T> {
  try {
    return await fn(getDb())
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) throw error
    throw new DatabaseUnavailableError(error)
  }
}

/** Lightweight connectivity probe for the health endpoint — does not use
 * withDb's error-wrapping since the caller here wants to know ok/fail, not
 * throw. */
export async function pingDatabase(): Promise<boolean> {
  try {
    const pool = getPool()
    await pool.query("SELECT 1")
    return true
  } catch {
    return false
  }
}
