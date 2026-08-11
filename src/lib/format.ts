export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

export function formatSigned(value: number, options?: { suffix?: string; decimals?: number }): string {
  const decimals = options?.decimals ?? 0
  const suffix = options?.suffix ?? ""
  const rounded = Number(value.toFixed(decimals))
  const sign = rounded > 0 ? "+" : ""
  return `${sign}${rounded}${suffix}`
}

export function formatSignedCompact(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${formatCompactNumber(Math.abs(value))}`
}

const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "day", seconds: 86400 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
]

const relativeFormatter = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" })

/** Formats an ISO timestamp relative to a fixed "now" so demo data reads
 * consistently regardless of when the app is actually run. */
export function formatRelativeTime(iso: string, now: Date): string {
  const diffSeconds = (new Date(iso).getTime() - now.getTime()) / 1000

  for (const { unit, seconds } of RELATIVE_UNITS) {
    const value = diffSeconds / seconds
    if (Math.abs(value) >= 1) {
      return relativeFormatter.format(Math.round(value), unit)
    }
  }
  return "just now"
}

