"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, CornerDownLeft } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ALL_NAV_ITEMS } from "@/lib/nav-config"
import { cn } from "@/lib/utils"

/** Quick-navigation search over the app's own routes. Scoped to nav items
 * for Phase 1 — indexing posts/accounts/conversations arrives with those
 * modules. */
export function SearchTrigger() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_NAV_ITEMS
    return ALL_NAV_ITEMS.filter((item) => item.title.toLowerCase().includes(q))
  }, [query])

  function go(href: string) {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            className="hidden h-8 w-64 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground hover:border-ring/50 sm:flex"
          />
        }
      >
        <Search className="size-3.5 shrink-0" strokeWidth={1.75} />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/70">
          /
        </kbd>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Jump to a page…"
            className="h-6 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">No matches.</p>
          ) : (
            results.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => go(item.href)}
                  className={cn(
                    "flex h-8 items-center gap-2.5 rounded-md px-2 text-left text-sm text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  <span className="flex-1 truncate">{item.title}</span>
                  <CornerDownLeft className="size-3 shrink-0 text-muted-foreground/50" />
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
