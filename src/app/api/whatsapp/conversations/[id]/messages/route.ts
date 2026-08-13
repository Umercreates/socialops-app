import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guard"
import { getConversationById, listMessages } from "@/lib/integrations/whatsapp/repository"
import { apiError } from "@/lib/api/errors"

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const { id } = await ctx.params
    const conversation = await getConversationById(auth.ctx.workspaceId, id)
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 })

    const messages = await listMessages(auth.ctx.workspaceId, id, 100)
    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        sender: m.sender,
        messageType: m.messageType,
        body: m.body,
        providerStatus: m.providerStatus,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    return apiError(error, "Failed to load messages")
  }
}
