import type { Post } from "@/types"

/**
 * Every date here is treated as UTC, matching how the mock ISO timestamps
 * are authored (`src/lib/data`). Using local-timezone getters/formatters
 * would make server-rendered HTML (Vercel runs UTC) disagree with whatever
 * timezone the visiting browser is in, which is a real hydration mismatch —
 * not a hypothetical one, it reproduces on any non-UTC client.
 */

export function isSameDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}

export function dateKeyFor(post: Post): string | null {
  const iso = post.status === "published" ? post.publishedAt : post.status === "draft" ? post.createdAt : post.scheduledFor
  if (!iso) return null
  return iso.slice(0, 10)
}

export function dateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

/** Weeks (Sun–Sat) covering the given month, including the leading/trailing
 * days needed to fill each row. */
export function getMonthGrid(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(Date.UTC(year, month, 1))
  const startOffset = firstOfMonth.getUTCDay()
  const gridStart = new Date(Date.UTC(year, month, 1 - startOffset))

  const weeks: Date[][] = []
  const cursor = new Date(gridStart)
  for (let week = 0; week < 6; week++) {
    const days: Date[] = []
    for (let day = 0; day < 7; day++) {
      days.push(new Date(cursor))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    weeks.push(days)
  }
  return weeks
}

export function getWeekDays(anchor: Date): Date[] {
  const start = new Date(anchor)
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    return d
  })
}

export function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(date)
}

export function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(date)
}
