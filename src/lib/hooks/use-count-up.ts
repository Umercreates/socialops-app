"use client"

import * as React from "react"

/** Animates a number from 0 up to `value` on mount (or whenever `value`
 * changes) using requestAnimationFrame — no layout thrash, cancels cleanly,
 * and collapses to an instant jump under prefers-reduced-motion. */
export function useCountUp(value: number, duration = 700): number {
  const [display, setDisplay] = React.useState(0)

  React.useEffect(() => {
    const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const effectiveDuration = prefersReduced ? 1 : duration
    const startTime = performance.now()
    let frame: number

    function tick(now: number) {
      const progress = Math.min(1, (now - startTime) / effectiveDuration)
      const eased = 1 - Math.pow(1 - progress, 3)
      // Unrounded — the last frame (progress === 1) lands on the exact
      // target, including any decimals; callers round via `format`.
      setDisplay(value * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return display
}
