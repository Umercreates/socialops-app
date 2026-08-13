import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guard"
import { listSocialAccounts } from "@/lib/platform/social-accounts"
import { apiError } from "@/lib/api/errors"

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const accounts = await listSocialAccounts(auth.ctx.workspaceId)
    return NextResponse.json({ accounts })
  } catch (error) {
    return apiError(error, "Failed to load social accounts")
  }
}
