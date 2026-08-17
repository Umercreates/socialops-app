import { NextResponse } from "next/server"
import { getMediaAssetById } from "@/lib/platform/media"
import { verifyPublicMediaAccess } from "@/lib/storage/public-url"
import { getStorageAdapter } from "@/lib/storage/local-adapter"

/**
 * Deliberately NOT session-gated - this exists so an external provider
 * (Instagram's Graph API) can fetch one specific asset without an
 * EasyLife session, which it can never have. Safety comes entirely from
 * the signature: a missing/expired/forged expires+sig pair 404s exactly
 * like an unknown id does, so this can't be used to enumerate or browse a
 * workspace's media - only to fetch the one asset a real signed URL was
 * just issued for.
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const url = new URL(request.url)

  if (!verifyPublicMediaAccess(id, url.searchParams.get("expires"), url.searchParams.get("sig"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const asset = await getMediaAssetById(id)
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const buffer = await getStorageAdapter().read(asset.storageKey)
  if (!buffer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, max-age=900",
    },
  })
}
