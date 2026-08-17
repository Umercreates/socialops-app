import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guard"
import { listConversations } from "@/lib/integrations/whatsapp/repository"
import { getLeadsByIds } from "@/lib/leads/repository"
import { apiError } from "@/lib/api/errors"

/** Real WhatsApp conversation list for this workspace — the data source for
 * the WhatsApp dashboard page's "Live Conversations" tab. Workspace-scoped
 * via the session, never a client-supplied workspace id. */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const conversations = await listConversations(auth.ctx.workspaceId)
    // One batch lookup for every conversation's lead instead of one query
    // per conversation (was a real N+1 - up to 100 separate round trips).
    const leadIds = conversations.map((c) => c.leadId).filter((id): id is string => Boolean(id))
    const leadsById = await getLeadsByIds(auth.ctx.workspaceId, leadIds)

    const withLeads = conversations.map((c) => ({
      id: c.id,
      contactPhone: c.contactPhone,
      contactName: c.contactName,
      status: c.status,
      lastMessageAt: c.lastMessageAt.toISOString(),
      lead: c.leadId ? (leadsById.get(c.leadId) ?? null) : null,
    }))

    return NextResponse.json({ conversations: withLeads })
  } catch (error) {
    return apiError(error, "Failed to load conversations")
  }
}
