import { ImageIcon, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PostMedia } from "@/types"

/** Restrained, low-saturation gradient pairs used only as a stand-in for
 * posts with no real picked media — not decorative UI chrome. */
const PLACEHOLDER_GRADIENTS = [
  "from-[#dbe7f7] to-[#eef2fb]",
  "from-[#f3ddea] to-[#f8ecf3]",
  "from-[#dcefe6] to-[#eef7f2]",
  "from-[#f6e9d8] to-[#faf3e8]",
  "from-[#e4e0f6] to-[#f2f0fb]",
]

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function isRealMediaUrl(url: string) {
  return url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("http")
}

interface PostThumbnailProps {
  media: PostMedia[]
  seed: string
  className?: string
}

export function PostThumbnail({ media, seed, className }: PostThumbnailProps) {
  const primary = media[0]

  if (primary && isRealMediaUrl(primary.url)) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg bg-muted", className)}>
        {primary.type === "video" ? (
          <video src={primary.url} className="size-full object-cover" muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primary.url} alt="" className="size-full object-cover" />
        )}
        {media.length > 1 && (
          <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
            +{media.length - 1}
          </span>
        )}
      </div>
    )
  }

  const gradient = PLACEHOLDER_GRADIENTS[hashString(seed) % PLACEHOLDER_GRADIENTS.length]
  const Icon = primary?.type === "video" ? Video : ImageIcon

  return (
    <div className={cn("flex items-center justify-center rounded-lg bg-gradient-to-br", gradient, className)}>
      <Icon className="size-4 text-foreground/25" strokeWidth={1.75} />
    </div>
  )
}
