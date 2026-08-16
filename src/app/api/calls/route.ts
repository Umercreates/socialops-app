import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { getLead } from "@/lib/leads/repository"
import { listCalls, queueCall, recordBlockedCall } from "@/lib/platform/calls"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { enqueueJob } from "@/lib/jobs/queue"
import { apiError } from "@/lib/api/errors"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const calls = await listCalls(auth.ctx.workspaceId)
    return NextResponse.json({ calls })
  } catch (error) {
    return apiError(error, "Failed to load calls")
  }
}

const createSchema = z.object({ leadId: z.string().uuid() })

/**
 * Requests a call to a lead. A staff member deliberately clicking this in
 * the dashboard IS the manual approval step - the safety gates that matter
 * are: the lead has actually consented to being called, and the workspace
 * has a genuinely live (tested, activated) OmniDimension connection. Either
 * failing produces a real, visible "blocked" call row explaining why,
 * never a silent no-op and never a call placed anyway.
 */
export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin", "manager", "sales"])
    if (roleCheck) return roleCheck

    const body = createSchema.parse(await request.json())
    const lead = await getLead(auth.ctx.workspaceId, body.leadId)
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

    const toNumber = lead.whatsappNumber
    if (!toNumber) {
      return NextResponse.json({ error: "This lead has no phone number on file." }, { status: 400 })
    }

    if (lead.callPermission !== "yes") {
      const call = await recordBlockedCall({
        workspaceId: auth.ctx.workspaceId,
        leadId: lead.id,
        toNumber,
        requestedByUserId: auth.ctx.userId,
        reason: "This lead has not given call permission.",
      })
      return NextResponse.json({ call, blocked: true }, { status: 200 })
    }

    const { live } = await resolveActiveConnection(auth.ctx.workspaceId, "omnidimension")
    if (!live) {
      const call = await recordBlockedCall({
        workspaceId: auth.ctx.workspaceId,
        leadId: lead.id,
        toNumber,
        requestedByUserId: auth.ctx.userId,
        reason: "OmniDimension is not connected and activated for this workspace. Configure it in Integrations.",
      })
      return NextResponse.json({ call, blocked: true }, { status: 200 })
    }

    const call = await queueCall({
      workspaceId: auth.ctx.workspaceId,
      leadId: lead.id,
      toNumber,
      requestedByUserId: auth.ctx.userId,
      initialStatus: "queued",
    })

    await enqueueJob({
      workspaceId: auth.ctx.workspaceId,
      type: "dispatch_call",
      payload: { callId: call.id, toNumber },
      maxAttempts: 3,
    })

    return NextResponse.json({ call, blocked: false }, { status: 201 })
  } catch (error) {
    return apiError(error, "Failed to queue call")
  }
}
