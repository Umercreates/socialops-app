import type { LucideIcon } from "lucide-react"

export interface SecondaryStat {
  icon: LucideIcon
  label: string
  value: string
}

export function SecondaryStatStrip({ stats }: { stats: SecondaryStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-2.5 rounded-xl bg-card px-3.5 py-3 ring-1 ring-foreground/10"
        >
          <stat.icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <div className="flex min-w-0 flex-col">
            <span className="text-base font-semibold text-foreground">{stat.value}</span>
            <span className="truncate text-xs text-muted-foreground">{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
