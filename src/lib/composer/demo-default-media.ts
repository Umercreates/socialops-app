import type { PostMedia } from "@/types"

/**
 * The Composer preview's Demo Mode default image - a bundled static asset
 * (public/demo/easylife-demo-post.png), never a real upload. It is only
 * ever injected into what PostPreview renders, never into the Composer's
 * actual `media` state, so it can never be submitted, uploaded through
 * /api/media, or persisted as a real media_asset row - clearing it (by
 * adding real demo media) and un-clearing it (by removing that media)
 * both fall out of that for free, with no extra state to track.
 */
export const DEMO_DEFAULT_MEDIA_ID = "demo-default-post-media"

export const DEMO_DEFAULT_MEDIA: PostMedia = {
  id: DEMO_DEFAULT_MEDIA_ID,
  type: "image",
  url: "/demo/easylife-demo-post.png",
  name: "EasyLife demo post",
}
