import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { disconnectSocialAccount } from "@/lib/platform/social-accounts"
import { apiError } from "@/lib/api/errors"

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const { id } = await ctx.params
    await disconnectSocialAccount(auth.ctx.workspaceId, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, "Failed to disconnect account")
  }
}
