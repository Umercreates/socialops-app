import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth, requireRole } from "@/lib/auth/guard"
import { verifySameOrigin } from "@/lib/auth/csrf"
import { resolveActiveConnection } from "@/lib/integrations/credential-resolution"
import { resolveCredentialValue } from "@/lib/integrations/service"
import { upsertConnection, getConnection } from "@/lib/integrations/repository"
import { encryptSecret } from "@/lib/integrations/crypto"
import { listFacebookPages, subscribePageToWebhooks } from "@/lib/integrations/facebook/client"
import { getLinkedInstagramAccount } from "@/lib/integrations/instagram/client"
import { upsertSocialAccount } from "@/lib/platform/social-accounts"
import { apiError } from "@/lib/api/errors"

/** Which Facebook Page this workspace publishes to - stored on the existing
 * facebook connection row (config.pageId/pageName, secret pageAccessToken)
 * rather than a new table, since it's two flat values, not a richer
 * per-selection config like the Google Sheets column mapping. */
export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const { row } = await resolveActiveConnection(auth.ctx.workspaceId, "facebook")
    const pageId = row?.config?.pageId
    const pageName = row?.config?.pageName
    if (typeof pageId !== "string") return NextResponse.json({ selection: null })
    return NextResponse.json({ selection: { pageId, pageName: typeof pageName === "string" ? pageName : null } })
  } catch (error) {
    return apiError(error, "Failed to load Facebook Page selection")
  }
}

const saveSchema = z.object({ pageId: z.string().trim().min(1) })

export async function PUT(request: Request) {
  const originCheck = verifySameOrigin(request)
  if (originCheck) return originCheck

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const roleCheck = requireRole(auth.ctx, ["owner", "admin"])
    if (roleCheck) return roleCheck

    const body = saveSchema.parse(await request.json())

    const { live, row } = await resolveActiveConnection(auth.ctx.workspaceId, "facebook")
    if (!live) return NextResponse.json({ error: "Facebook isn't connected and activated for this workspace." }, { status: 400 })
    const { value: userAccessToken } = resolveCredentialValue(row, "accessToken", "facebook")
    if (!userAccessToken) {
      return NextResponse.json({ error: "No Facebook access token on file - reconnect Facebook in Integrations." }, { status: 400 })
    }

    // Re-fetches from Facebook rather than trusting a client-supplied Page
    // access token - the client only ever sends the chosen Page's id.
    const pagesResult = await listFacebookPages(userAccessToken)
    if (!pagesResult.ok) return NextResponse.json({ error: pagesResult.errorMessage }, { status: 502 })
    const page = pagesResult.pages?.find((p) => p.id === body.pageId)
    if (!page) return NextResponse.json({ error: "That Page wasn't found among the ones this account manages." }, { status: 404 })

    await upsertConnection({
      workspaceId: auth.ctx.workspaceId,
      provider: "facebook",
      config: { pageId: page.id, pageName: page.name },
      secretDataEncrypted: { pageAccessToken: encryptSecret(page.accessToken).blob },
    })

    const facebookConnection = await getConnection(auth.ctx.workspaceId, "facebook")
    await upsertSocialAccount({
      workspaceId: auth.ctx.workspaceId,
      provider: "facebook",
      integrationConnectionId: facebookConnection?.id ?? null,
      externalAccountId: page.id,
      accountName: page.name,
      capabilities: ["publishing", "comments"],
    })

    // Instagram publishing "just works" once the connected Page has a
    // linked professional account - no separate Instagram OAuth grant, so
    // this is the only place its social_accounts row gets created/updated.
    const instagramAccount = await getLinkedInstagramAccount(page.id, page.accessToken)
    if (instagramAccount.ok && instagramAccount.igUserId) {
      await upsertSocialAccount({
        workspaceId: auth.ctx.workspaceId,
        provider: "instagram",
        integrationConnectionId: facebookConnection?.id ?? null,
        externalAccountId: instagramAccount.igUserId,
        accountName: instagramAccount.username ?? instagramAccount.igUserId,
        username: instagramAccount.username,
        avatarUrl: instagramAccount.profilePictureUrl,
        capabilities: ["publishing", "comments"],
      })
    }

    // Subscribes this Page (and its linked Instagram account) to real-time
    // comment webhooks - zero manual webhook setup for the client. Never
    // blocks the Page selection itself on failure; comment ingestion just
    // won't start until a retry (e.g. re-saving the Page) succeeds.
    const subscribeResult = await subscribePageToWebhooks(page.id, page.accessToken)
    if (!subscribeResult.ok) {
      console.error("Facebook webhook subscription failed:", subscribeResult.errorMessage)
    }

    return NextResponse.json({ selection: { pageId: page.id, pageName: page.name }, instagramLinked: Boolean(instagramAccount.ok) })
  } catch (error) {
    return apiError(error, "Failed to save Facebook Page selection")
  }
}
