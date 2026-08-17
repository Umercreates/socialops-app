import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { updateMemberRole, removeMember } from "@/lib/platform/team"
import { apiError } from "@/lib/api/errors"

const patchSchema = z.object({ role: z.enum(["owner", "admin", "manager", "sales"]) })

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const body = patchSchema.parse(await request.json())
    if (body.role === "owner" && auth.ctx.role !== "owner") {
      return NextResponse.json({ error: "Only an owner can grant the owner role." }, { status: 403 })
    }

    const { id } = await ctx.params
    const result = await updateMemberRole(auth.ctx.workspaceId, id, body.role)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, "Failed to update member role")
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const { id } = await ctx.params
    const result = await removeMember(auth.ctx.workspaceId, id)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error, "Failed to remove member")
  }
}
