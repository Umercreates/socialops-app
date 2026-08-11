import type { SocialPlatform } from "@/types"
import { cn } from "@/lib/utils"

/**
 * Lucide (the icon set this project standardizes on) does not ship brand
 * logo glyphs, so each platform mark here is composed from simple strokes
 * in the same 24x24 / round-cap style as the rest of the icon set, rather
 * than reproducing a trademarked logo path from memory.
 */
const GLYPHS: Record<SocialPlatform, React.ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.1" cy="6.9" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <path d="M13.5 21v-7.2h2.4l.4-2.8h-2.8v-1.8c0-.8.2-1.3 1.4-1.3h1.5V5.2A20 20 0 0 0 14 5c-2.2 0-3.7 1.3-3.7 3.8v2h-2.5v2.8h2.5V21Z" />
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.2" cy="8.3" r="0.9" fill="currentColor" stroke="none" />
      <path d="M8.2 11.2V17" />
      <path d="M12 17v-3.6c0-1.3.9-2.2 2.1-2.2s1.9.9 1.9 2.2V17" />
      <path d="M12 11.2V17" />
    </>
  ),
  tiktok: (
    <>
      <path d="M14.5 3.5v10.3a2.9 2.9 0 1 1-2.4-2.86" />
      <path d="M14.5 3.5c.45 2.55 2.2 4.4 4.6 4.75" />
    </>
  ),
  youtube: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="4" />
      <path d="M10.3 9.6v4.8l4.4-2.4Z" fill="currentColor" stroke="none" />
    </>
  ),
  x: <path d="M5 5l14 14M19 5 5 19" />,
}

const PLATFORM_ACCENT: Record<SocialPlatform, string> = {
  instagram: "#c2377b",
  facebook: "#1877f2",
  linkedin: "#0a66c2",
  tiktok: "#1a7a75",
  youtube: "#d0302f",
  x: "currentColor",
}

interface PlatformIconProps extends React.SVGAttributes<SVGSVGElement> {
  platform: SocialPlatform
  size?: number
  /** Tint the glyph with the platform's brand accent instead of inheriting text color. */
  accent?: boolean
}

export function PlatformIcon({ platform, size = 16, accent = false, className, style, ...props }: PlatformIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      style={accent ? { color: PLATFORM_ACCENT[platform], ...style } : style}
      {...props}
    >
      {GLYPHS[platform]}
    </svg>
  )
}

export const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
}
