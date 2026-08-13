import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export interface SecondaryStat {
  icon: LucideIcon
  label: string
  value: ReactNode
}

export function SecondaryStatStrip({ stats }: { stats: SecondaryStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-2.5 rounded-xl bg-card px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10 transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
        >
          <stat.icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <div className="flex min-w-0 flex-col">
            <span className="text-base font-semibold tabular-nums text-foreground">{stat.value}</span>
            <span className="truncate text-xs text-muted-foreground">{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
