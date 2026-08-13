import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { listActivities, createActivity } from "@/lib/leads/repository"
import { apiError } from "@/lib/api/errors"
import type { LeadActivityType } from "@/types"

const ALLOWED_MANUAL_TYPES: LeadActivityType[] = ["note-added", "contacted"]

const createActivitySchema = z.object({
  type: z.enum(ALLOWED_MANUAL_TYPES as [LeadActivityType, ...LeadActivityType[]]),
  description: z.string().trim().min(1).max(2000),
})

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const { id } = await ctx.params
    const activities = await listActivities(auth.ctx.workspaceId, id)
    return NextResponse.json({ activities })
  } catch (error) {
    return apiError(error, "Failed to load activity timeline")
  }
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const { id } = await ctx.params
    const body = createActivitySchema.parse(await request.json())

    const activity = await createActivity(auth.ctx.workspaceId, id, auth.ctx.userId, body.type, body.description)
    if (!activity) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    return apiError(error, "Failed to add activity")
  }
}
