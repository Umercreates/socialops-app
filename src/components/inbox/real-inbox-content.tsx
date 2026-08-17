import { Inbox as InboxIcon } from "lucide-react"
import { LiveConversationsList } from "@/components/whatsapp/live-conversations-list"

/**
 * Real Unified Inbox — WhatsApp is the only platform this app actually
 * ingests direct messages from today (Instagram/Facebook DM APIs aren't
 * integrated). Showing a fake multi-platform inbox here would claim DM
 * support this app doesn't have, so this page is honest about scope
 * instead of simulating conversations for every social platform.
 */
export function RealInboxContent() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
          <InboxIcon className="size-5" />
          Inbox
        </h2>
        <p className="text-sm text-muted-foreground">
          WhatsApp is the only platform connected for direct messages right now — Instagram and Facebook DM inboxes
          aren&apos;t integrated yet, so they&apos;re not shown here rather than faked.
        </p>
      </div>

      <LiveConversationsList />
    </div>
  )
}
