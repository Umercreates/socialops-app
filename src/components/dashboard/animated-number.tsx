"use client"

import { useCountUp } from "@/lib/hooks/use-count-up"

interface AnimatedNumberProps {
  value: number
  format?: (n: number) => string
  duration?: number
}

/** Drop-in replacement for a formatted numeric display — counts up from 0
 * once, then renders exactly what `format` would render for a static value. */
export function AnimatedNumber({ value, format, duration }: AnimatedNumberProps) {
  const animated = useCountUp(value, duration)
  return <>{format ? format(animated) : Math.round(animated)}</>
}
