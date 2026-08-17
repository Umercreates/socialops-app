import { timingSafeEqual } from "node:crypto"

/** Constant-time comparison for bearer-token-style header checks
 * (MIGRATION_TOKEN, CRON_SECRET, etc) - a plain `!==` leaks a timing
 * side-channel proportional to the matching prefix length. Safe against
 * length mismatches (never throws, just returns false). */
export function timingSafeTokenEqual(provided: string | null, expected: string): boolean {
  if (!provided) return false
  const providedBuf = Buffer.from(provided)
  const expectedBuf = Buffer.from(expected)
  if (providedBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(providedBuf, expectedBuf)
}
