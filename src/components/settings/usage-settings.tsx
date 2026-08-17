"use client"

import * as React from "react"
import { Gauge, TriangleAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { formatCompactNumber } from "@/lib/format"
import { USAGE_SUMMARY } from "@/lib/data/call-agent"
import { useDemoMode } from "@/lib/demo-mode-context"

export function UsageSettings() {
  const demoMode = useDemoMode()
  const [threshold, setThreshold] = React.useState(USAGE_SUMMARY.budgetThreshold)
  const overThreshold = USAGE_SUMMARY.estimatedMonthlyCost > threshold
  const maxUsed = Math.max(...USAGE_SUMMARY.metrics.map((m) => m.used), 1)

  if (!demoMode) {
    return (
      <Card className="px-5 py-5">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-1.5 text-[15px]">
            <Gauge className="size-4" />
            Usage this month
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <p className="text-sm text-muted-foreground">
            Usage and cost tracking isn&apos;t available yet - each connected provider (WhatsApp, Gemini, OmniDimension, etc.) bills you
            directly, and EasyLife doesn&apos;t currently meter usage against those accounts. Check each provider&apos;s own dashboard for
            billing details.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="gap-4 px-5 py-5">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-1.5 text-[15px]">
            <Gauge className="size-4" />
            Usage this month
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Everything here is free-tier or simulated in demo mode — costs only start once you connect a real WhatsApp, calling, or AI provider.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-0">
          {USAGE_SUMMARY.metrics.map((metric) => (
            <div key={metric.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">{metric.label}</span>
                <span className="text-muted-foreground">
                  {formatCompactNumber(metric.used)} {metric.unit} · {metric.estimatedCost > 0 ? `$${metric.estimatedCost.toFixed(2)}` : "$0.00"}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(2, Math.round((metric.used / maxUsed) * 100))}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="gap-4 px-5 py-5">
        <CardHeader className="px-0">
          <CardTitle className="text-[15px]">Estimated monthly cost</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex items-end justify-between gap-3">
            <span className="text-2xl font-semibold text-foreground">${USAGE_SUMMARY.estimatedMonthlyCost.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">of ${threshold.toFixed(0)} budget</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget-threshold">Budget warning threshold ($/mo)</Label>
            <Input
              id="budget-threshold"
              type="number"
              min={0}
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
              className="h-9 w-40"
            />
          </div>
          {overThreshold && (
            <p className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <TriangleAlert className="size-3.5 shrink-0" />
              Estimated cost is above your budget threshold.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            All paid services here are pay-as-you-go — nothing renews or scales up automatically without your approval.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
