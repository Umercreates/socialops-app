import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { listLeads, createLead } from "@/lib/leads/repository"
import { apiError } from "@/lib/api/errors"

const createLeadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  whatsappNumber: z.string().trim().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  company: z.string().trim().max(200).optional(),
  city: z.string().trim().max(200).optional(),
  businessType: z.string().trim().max(200).optional(),
  location: z.string().trim().max(200).optional(),
  sourcePlatform: z.string().trim().max(50).optional(),
  sourceCampaign: z.string().trim().max(200).optional(),
  serviceInterested: z.string().trim().max(200).optional(),
  requirement: z.string().trim().max(2000).optional(),
  painPoint: z.string().trim().max(2000).optional(),
  budget: z.string().trim().max(100).optional(),
  timeline: z.string().trim().max(100).optional(),
  leadScore: z.number().int().min(0).max(100).optional(),
  stage: z.string().trim().max(50).optional(),
  status: z.string().trim().max(50).optional(),
  callPermission: z.enum(["yes", "no", "unknown"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  notes: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim().max(50)).max(20).optional(),
})

export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const url = new URL(request.url)
    const params = url.searchParams

    const result = await listLeads({
      workspaceId: auth.ctx.workspaceId,
      status: params.get("status") ?? undefined,
      source: params.get("source") ?? undefined,
      assignedTo: params.get("assignedTo") ?? undefined,
      search: params.get("search") ?? undefined,
      sort: (params.get("sort") as "created_at" | "updated_at" | "lead_score" | null) ?? undefined,
      order: (params.get("order") as "asc" | "desc" | null) ?? undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
      offset: params.get("offset") ? Number(params.get("offset")) : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    return apiError(error, "Failed to load leads")
  }
}

export async function POST(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const body = createLeadSchema.parse(await request.json())
    const lead = await createLead({
      workspaceId: auth.ctx.workspaceId,
      actorUserId: auth.ctx.userId,
      ...body,
      email: body.email || undefined,
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    return apiError(error, "Failed to create lead")
  }
}
