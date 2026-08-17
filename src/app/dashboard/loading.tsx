import { Loader2 } from "lucide-react"

/**
 * Fallback for the {children} slot in dashboard/layout.tsx while a page
 * segment is still doing its own async work (data fetching, etc). The
 * sidebar/header in the layout render immediately regardless - this only
 * covers the content area, so navigation never shows a blank screen while
 * a page's server-side data fetch is in flight. Perceived-latency fix
 * only; the real fix is the pages doing less work per request (see the
 * query-consolidation and indexing changes elsewhere in this pass).
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  )
}
