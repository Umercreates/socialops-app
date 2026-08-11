"use client"

import * as React from "react"
import type { EngagementPoint } from "@/types"
import { formatNumber, formatCompactNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const WIDTH = 640
const HEIGHT = 200
const PADDING = { top: 10, right: 10, bottom: 22, left: 44 }
const LINE_COLOR = "var(--series-1)"

function niceCeiling(value: number): number {
  if (value <= 0) return 10
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

function pickLabelIndices(count: number, maxLabels = 6): number[] {
  if (count <= maxLabels) return Array.from({ length: count }, (_, i) => i)
  const step = (count - 1) / (maxLabels - 1)
  return Array.from({ length: maxLabels }, (_, i) => Math.round(i * step))
}

interface EngagementChartProps {
  data: EngagementPoint[]
}

/** Single-series area chart — the "total engagements" trend. Kept to one
 * series so it never needs a second axis (see `EngagementOverview`). */
export function EngagementChart({ data }: EngagementChartProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)

  const plotWidth = WIDTH - PADDING.left - PADDING.right
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom

  const maxValue = niceCeiling(Math.max(...data.map((d) => d.value)))
  const yTicks = [0, 0.5, 1].map((t) => Math.round(maxValue * t))

  const xFor = (i: number) => PADDING.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * plotWidth)
  const yFor = (value: number) => PADDING.top + plotHeight - (value / maxValue) * plotHeight

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(d.value)}`).join(" ")
  const areaPath = `${linePath} L${xFor(data.length - 1)},${yFor(0)} L${xFor(0)},${yFor(0)} Z`

  const labelIndices = new Set(pickLabelIndices(data.length))

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH
    const ratio = (relativeX - PADDING.left) / plotWidth
    const index = Math.round(ratio * (data.length - 1))
    setHoverIndex(Math.min(data.length - 1, Math.max(0, index)))
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null
  const hoverX = hoverIndex !== null ? xFor(hoverIndex) : null
  const tooltipOnLeft = hoverX !== null && hoverX > WIDTH * 0.7

  const last = data[data.length - 1]

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label="Total engagements over time"
      >
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text x={PADDING.left - 8} y={yFor(tick)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">
              {formatNumber(tick)}
            </text>
          </g>
        ))}

        {data.map((d, i) =>
          labelIndices.has(i) ? (
            <text key={d.date + i} x={xFor(i)} y={HEIGHT - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {d.date}
            </text>
          ) : null
        )}

        <path d={areaPath} fill={LINE_COLOR} fillOpacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={xFor(data.length - 1)} cy={yFor(last.value)} r={4} fill={LINE_COLOR} stroke="var(--card)" strokeWidth={2} />

        {hoverX !== null && (
          <>
            <line x1={hoverX} x2={hoverX} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} stroke="var(--muted-foreground)" strokeOpacity={0.35} strokeWidth={1} />
            {hoverIndex !== null && (
              <circle cx={hoverX} cy={yFor(data[hoverIndex].value)} r={4} fill={LINE_COLOR} stroke="var(--card)" strokeWidth={2} />
            )}
          </>
        )}
      </svg>

      {hovered && hoverX !== null && (
        <div
          className={cn(
            "pointer-events-none absolute top-1 z-10 flex flex-col gap-0.5 rounded-lg bg-popover px-2.5 py-1.5 text-xs shadow-md ring-1 ring-foreground/10"
          )}
          style={
            tooltipOnLeft
              ? { right: `${100 - (hoverX / WIDTH) * 100}%`, marginRight: 10 }
              : { left: `${(hoverX / WIDTH) * 100}%`, marginLeft: 10 }
          }
        >
          <span className="text-muted-foreground">{hovered.date}</span>
          <span className="font-medium tabular-nums text-popover-foreground">{formatCompactNumber(hovered.value)}</span>
        </div>
      )}
    </div>
  )
}
