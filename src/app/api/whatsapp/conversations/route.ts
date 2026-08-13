import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guard"
import { listConversations } from "@/lib/integrations/whatsapp/repository"
import { getLead } from "@/lib/leads/repository"
import { apiError } from "@/lib/api/errors"

/** Real WhatsApp conversation list for this workspace — the data source for
 * the WhatsApp dashboard page's "Live Conversations" tab. Workspace-scoped
 * via the session, never a client-supplied workspace id. */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const conversations = await listConversations(auth.ctx.workspaceId)
    const withLeads = await Promise.all(
      conversations.map(async (c) => ({
        id: c.id,
        contactPhone: c.contactPhone,
        contactName: c.contactName,
        status: c.status,
        lastMessageAt: c.lastMessageAt.toISOString(),
        lead: c.leadId ? await getLead(auth.ctx.workspaceId, c.leadId) : null,
      }))
    )

    return NextResponse.json({ conversations: withLeads })
  } catch (error) {
    return apiError(error, "Failed to load conversations")
  }
}
