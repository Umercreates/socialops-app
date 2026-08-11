/**
 * Fixed "now" for the mock data layer so relative timestamps (activity feed,
 * notifications) always read naturally against the seeded demo data,
 * independent of the visitor's real clock.
 */
export const MOCK_NOW = new Date("2026-08-09T16:10:00Z")

/** Use instead of `new Date().toISOString()` when stamping anything the
 * demo creates live (new leads, messages, activity, sync events) — keeps
 * every "just now" reading correct against `MOCK_NOW` instead of drifting
 * into the future as real time passes since that fixed anchor. */
export function nowIso(): string {
  return MOCK_NOW.toISOString()
}
