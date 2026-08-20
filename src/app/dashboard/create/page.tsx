import type { Metadata } from "next"
import { Composer } from "@/components/composer/composer"
import { getDashboardViewMode } from "@/lib/dashboard-view-mode"

export const metadata: Metadata = { title: "Create Post — EasyLife" }

export default async function CreatePostPage() {
  const viewMode = await getDashboardViewMode()
  // Keying by mode forces a full remount on a Demo <-> Client switch, so no
  // draft caption/media/selected-account state can ever leak from one
  // mode into the other - Composer is shared, not Demo/Real-split, so a
  // plain re-render wouldn't otherwise clear its local state.
  return <Composer key={viewMode} />
}
