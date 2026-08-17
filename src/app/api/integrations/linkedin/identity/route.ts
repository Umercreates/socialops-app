import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { upsertConnection, getConnection } from "@/lib/integrations/repository"
import { upsertSocialAccount } from "@/lib/platform/social-accounts"
import { apiError } from "@/lib/api/errors"

/** Which identity (the member themselves, or a company Page they
 * administer) this workspace publishes to LinkedIn as - stored on the
 * existing linkedin connection row's config, same pattern as Facebook's
 * Page selection. */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const { row } = await resolveActiveConnection(auth.ctx.workspaceId, "linkedin")
    const authorUrn = row?.config?.authorUrn
    if (typeof authorUrn !== "string") return NextResponse.json({ selection: null })
    return NextResponse.json({
      selection: {
        authorUrn,
        authorName: typeof row?.config?.authorName === "string" ? row.config.authorName : null,
        authorType: row?.config?.authorType === "organization" ? "organization" : "member",
      },
    })
  } catch (error) {
    return apiError(error, "Failed to load LinkedIn identity selection")
  }
}

const saveSchema = z.object({
  authorUrn: z.string().trim().min(1),
  authorName: z.string().trim().max(500).optional(),
  authorType: z.enum(["member", "organization"]),
})

export async function PUT(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const body = saveSchema.parse(await request.json())
    const { live } = await resolveActiveConnection(auth.ctx.workspaceId, "linkedin")
    if (!live) return NextResponse.json({ error: "LinkedIn isn't connected and activated for this workspace." }, { status: 400 })

    await upsertConnection({
      workspaceId: auth.ctx.workspaceId,
      provider: "linkedin",
      config: { authorUrn: body.authorUrn, authorName: body.authorName ?? null, authorType: body.authorType },
    })

    const linkedinConnection = await getConnection(auth.ctx.workspaceId, "linkedin")
    await upsertSocialAccount({
      workspaceId: auth.ctx.workspaceId,
      provider: "linkedin",
      integrationConnectionId: linkedinConnection?.id ?? null,
      externalAccountId: body.authorUrn,
      accountName: body.authorName ?? body.authorUrn,
      accountType: body.authorType,
      capabilities: ["publishing"],
    })

    return NextResponse.json({ selection: { authorUrn: body.authorUrn, authorName: body.authorName ?? null, authorType: body.authorType } })
  } catch (error) {
    return apiError(error, "Failed to save LinkedIn identity selection")
  }
}
