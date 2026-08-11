import type { SocialPlatform } from "@/types"

export const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "youtube", "x"]

export interface ComposerVariantState {
  caption: string
  hashtags: string
  title: string
  firstComment: string
  link: string
}

export const EMPTY_VARIANT: ComposerVariantState = {
  caption: "",
  hashtags: "",
  title: "",
  firstComment: "",
  link: "",
}

/** Which optional fields are meaningful per platform — the variant editor
 * only renders what applies instead of one generic form for every network. */
export const PLATFORM_FIELDS: Record<SocialPlatform, { title?: boolean; firstComment?: boolean; link?: boolean }> = {
  instagram: { firstComment: true },
  facebook: { link: true },
  linkedin: { link: true },
  tiktok: {},
  youtube: { title: true },
  x: { link: true },
}
