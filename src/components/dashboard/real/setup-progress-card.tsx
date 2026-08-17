import Link from "next/link"
import { Circle, CircleCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SetupChecklistItem {
  label: string
  done: boolean
}

interface SetupProgressCardProps {
  configuredProviders: number
  totalProviders: number
  items: SetupChecklistItem[]
}

/** Shown on Dashboard Home for a workspace that hasn't finished setup yet —
 * the real equivalent of the "2/7 integrations configured" example: a short,
 * honest checklist instead of a wall of demo numbers. */
export function SetupProgressCard({ configuredProviders, totalProviders, items }: SetupProgressCardProps) {
  return (
    <Card className="gap-3 border-brand/30 bg-brand/3 px-4 py-4 sm:px-5 sm:py-5">
      <CardHeader className="flex-row items-center justify-between px-0">
        <CardTitle className="text-[15px]">Setup progress</CardTitle>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {configuredProviders}/{totalProviders} integrations configured
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-0">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            {item.done ? (
              <CircleCheck className="size-4 shrink-0 text-success" strokeWidth={1.75} />
            ) : (
              <Circle className="size-4 shrink-0 text-muted-foreground/40" strokeWidth={1.75} />
            )}
            <span className={cn(item.done ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
          </div>
        ))}
        <Link href="/dashboard/onboarding" prefetch={false} className="mt-1 text-xs font-medium text-brand hover:underline">
          View full getting-started checklist
        </Link>
      </CardContent>
    </Card>
  )
}
