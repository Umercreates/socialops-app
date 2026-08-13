import { randomUUID } from "node:crypto"
import { and, eq, gt, sql } from "drizzle-orm"
import { withDb } from "@/lib/db/client"
import { loginAttempts } from "@/lib/db/schema"

/**
 * DB-backed login rate limiting — deliberately not an in-memory counter,
 * so it survives process restarts and would hold even across multiple
 * Passenger workers, rather than being a single fragile in-process gate.
 */

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS_PER_EMAIL = 8
const MAX_ATTEMPTS_PER_IP = 20

export async function isLoginRateLimited(normalizedEmail: string, ip: string | null): Promise<boolean> {
  const windowStart = new Date(Date.now() - WINDOW_MS)

  return withDb(async (db) => {
    const [byEmail, byIp] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(loginAttempts)
        .where(
          and(
            eq(loginAttempts.normalizedEmail, normalizedEmail),
            eq(loginAttempts.success, false),
            gt(loginAttempts.createdAt, windowStart)
          )
        ),
      ip
        ? db
            .select({ count: sql<number>`count(*)` })
            .from(loginAttempts)
            .where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.success, false), gt(loginAttempts.createdAt, windowStart)))
        : Promise.resolve([{ count: 0 }]),
    ])

    const emailCount = Number(byEmail[0]?.count ?? 0)
    const ipCount = Number(byIp[0]?.count ?? 0)
    return emailCount >= MAX_ATTEMPTS_PER_EMAIL || ipCount >= MAX_ATTEMPTS_PER_IP
  })
}

export async function recordLoginAttempt(normalizedEmail: string, ip: string | null, success: boolean): Promise<void> {
  await withDb(async (db) => {
    await db.insert(loginAttempts).values({ id: randomUUID(), normalizedEmail, ip, success })
  })
}
