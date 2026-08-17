import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/guard"
import { getMediaAsset } from "@/lib/platform/media"
import { getStorageAdapter } from "@/lib/storage/local-adapter"
import { apiError } from "@/lib/api/errors"

/** Authenticated retrieval - any signed-in member of the owning workspace
 * can view a media asset (same visibility as the rest of the workspace's
 * content), but no one outside it, and never an anonymous request. A
 * lookup for another workspace's asset id 404s exactly like a missing one
 * does, rather than a distinguishable 403, so it can't be used to confirm
 * an id belongs to someone else's workspace. */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const { id } = await ctx.params
    const asset = await getMediaAsset(auth.ctx.workspaceId, id)
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const buffer = await getStorageAdapter().read(asset.storageKey)
    if (!buffer) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error) {
    return apiError(error, "Failed to load media")
  }
}
