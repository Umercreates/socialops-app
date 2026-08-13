import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { getPool } from "./client"

/**
 * Minimal, transparent migration runner — no drizzle-kit, no external
 * migration framework. Reads `migrations/*.sql` (relative to the process's
 * working directory, which is the app root under both `next dev` and the
 * production `app.js` custom server), applies any not yet recorded in
 * `socialops.schema_migrations`, each inside its own transaction.
 *
 * Migration files are the reviewable source of truth; this runner does not
 * generate or modify them.
 */

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations")

export interface MigrationResult {
  applied: string[]
  alreadyApplied: string[]
}

async function ensureMigrationsTable(client: import("pg").PoolClient) {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS socialops;
    CREATE TABLE IF NOT EXISTS socialops.schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
}

export async function runMigrations(): Promise<MigrationResult> {
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort()

  const pool = getPool()
  const client = await pool.connect()
  const applied: string[] = []
  const alreadyApplied: string[] = []

  try {
    await ensureMigrationsTable(client)

    const { rows } = await client.query<{ version: string }>(
      "SELECT version FROM socialops.schema_migrations"
    )
    const appliedVersions = new Set(rows.map((r) => r.version))

    for (const file of files) {
      const version = file.replace(/\.sql$/, "")
      if (appliedVersions.has(version)) {
        alreadyApplied.push(version)
        continue
      }

      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8")
      try {
        await client.query("BEGIN")
        await client.query(sql)
        await client.query("COMMIT")
        applied.push(version)
      } catch (error) {
        await client.query("ROLLBACK")
        throw new Error(`Migration ${file} failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  } finally {
    client.release()
  }

  return { applied, alreadyApplied }
}
