"use client"

import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ThumbsUp,
  Repeat2,
  Share,
  MoreHorizontal,
  Eye,
  Play,
} from "lucide-react"
import { CURRENT_WORKSPACE } from "@/lib/data/workspace"
import { DEMO_DEFAULT_MEDIA_ID } from "@/lib/composer/demo-default-media"
import type { ComposerVariantState } from "@/components/composer/composer-types"
import type { PostMedia, SocialPlatform } from "@/types"

/** The bundled Demo Mode default image is a full graphic (logo + headline
 * text), so it always renders with object-contain (letterboxed, never
 * cropped) regardless of the preview's aspect ratio - real uploaded media
 * (demo or client) keeps the existing object-cover fill behavior. */
function mediaObjectFit(item: PostMedia) {
  return item.id === DEMO_DEFAULT_MEDIA_ID ? "object-contain" : "object-cover"
}

function MediaFrame({ media, aspect }: { media: PostMedia[]; aspect: string }) {
  const primary = media[0]
  return (
    <div className={`relative w-full overflow-hidden bg-muted ${aspect}`}>
      {primary ? (
        primary.type === "video" ? (
          <video src={primary.url} className={`size-full ${mediaObjectFit(primary)}`} muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primary.url} alt="" className={`size-full ${mediaObjectFit(primary)}`} />
        )
      ) : (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-xs text-muted-foreground">
          No media selected
        </div>
      )}
    </div>
  )
}

function Avatar() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[11px] font-semibold text-brand">
      NS
    </span>
  )
}

function CaptionText({ text }: { text: string }) {
  return (
    <p className="text-[13px] leading-snug whitespace-pre-wrap text-foreground">
      {text || <span className="text-muted-foreground">Your caption will appear here…</span>}
    </p>
  )
}

interface PostPreviewProps {
  platform: SocialPlatform
  variant: ComposerVariantState
  media: PostMedia[]
}

export function PostPreview({ platform, variant, media }: PostPreviewProps) {
  const combinedCaption = [variant.caption, variant.hashtags].filter(Boolean).join("\n\n")

  switch (platform) {
    case "instagram":
      return (
        <div className="overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Avatar />
            <span className="text-[13px] font-medium text-foreground">easylife</span>
            <MoreHorizontal className="ml-auto size-4 text-muted-foreground" />
          </div>
          <MediaFrame media={media} aspect="aspect-square" />
          <div className="flex items-center gap-3 px-3 pt-2.5">
            <Heart className="size-5 text-foreground" strokeWidth={1.75} />
            <MessageCircle className="size-5 text-foreground" strokeWidth={1.75} />
            <Send className="size-5 text-foreground" strokeWidth={1.75} />
            <Bookmark className="ml-auto size-5 text-foreground" strokeWidth={1.75} />
          </div>
          <div className="flex flex-col gap-1 px-3 py-2.5">
            <span className="text-[13px] font-medium text-foreground">2,481 likes</span>
            <div className="text-[13px] leading-snug text-foreground">
              <span className="font-medium">easylife</span>{" "}
              {variant.caption || <span className="text-muted-foreground">Your caption will appear here…</span>}
            </div>
            {variant.hashtags && <span className="text-[13px] text-brand">{variant.hashtags}</span>}
            {variant.firstComment && (
              <span className="text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground">easylife</span> {variant.firstComment}
              </span>
            )}
          </div>
        </div>
      )

    case "facebook":
      return (
        <div className="overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Avatar />
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-foreground">{CURRENT_WORKSPACE.name}</span>
              <span className="text-[11px] text-muted-foreground">Just now · 🌐</span>
            </div>
            <MoreHorizontal className="ml-auto size-4 text-muted-foreground" />
          </div>
          <div className="px-3 pb-2.5">
            <CaptionText text={combinedCaption} />
            {variant.link && <span className="mt-1 block truncate text-[12px] text-brand">{variant.link}</span>}
          </div>
          <MediaFrame media={media} aspect="aspect-[4/3]" />
          <div className="flex items-center gap-4 border-t border-border px-3 py-2 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ThumbsUp className="size-3.5" /> Like
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="size-3.5" /> Comment
            </span>
            <span className="flex items-center gap-1.5">
              <Share className="size-3.5" /> Share
            </span>
          </div>
        </div>
      )

    case "linkedin":
      return (
        <div className="overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Avatar />
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-foreground">{CURRENT_WORKSPACE.name}</span>
              <span className="text-[11px] text-muted-foreground">Social media studio · 1st</span>
            </div>
          </div>
          <div className="px-3 pb-2.5">
            <CaptionText text={combinedCaption} />
            {variant.link && <span className="mt-1 block truncate text-[12px] text-brand">{variant.link}</span>}
          </div>
          <MediaFrame media={media} aspect="aspect-[4/3]" />
          <div className="flex items-center gap-4 border-t border-border px-3 py-2 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ThumbsUp className="size-3.5" /> Like
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="size-3.5" /> Comment
            </span>
            <span className="flex items-center gap-1.5">
              <Repeat2 className="size-3.5" /> Repost
            </span>
          </div>
        </div>
      )

    case "tiktok":
      return (
        <div className="relative mx-auto aspect-[9/16] w-full max-w-52 overflow-hidden rounded-xl bg-black ring-1 ring-foreground/10">
          {media[0] ? (
            media[0].type === "video" ? (
              <video src={media[0].url} className={`size-full ${mediaObjectFit(media[0])}`} muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media[0].url} alt="" className={`size-full ${mediaObjectFit(media[0])}`} />
            )
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-b from-zinc-800 to-black text-xs text-white/50">
              No media selected
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex flex-col gap-1 text-white">
              <span className="text-[12px] font-medium">@easylife</span>
              <span className="line-clamp-2 text-[11px] leading-snug">{variant.caption || "Your caption will appear here…"}</span>
              {variant.hashtags && <span className="text-[11px] text-white/80">{variant.hashtags}</span>}
            </div>
            <div className="flex flex-col items-center gap-2.5 text-white">
              <Heart className="size-5" />
              <MessageCircle className="size-5" />
              <Share className="size-5" />
            </div>
          </div>
        </div>
      )

    case "youtube":
      return (
        <div className="overflow-hidden rounded-xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10">
          <div className="relative">
            <MediaFrame media={media} aspect="aspect-video" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-9 items-center justify-center rounded-full bg-black/50">
                <Play className="size-4 fill-white text-white" />
              </span>
            </span>
          </div>
          <div className="flex gap-2.5 px-3 py-2.5">
            <Avatar />
            <div className="flex flex-col gap-0.5">
              <span className="line-clamp-2 text-[13px] font-medium text-foreground">
                {variant.title || "Your video title will appear here"}
              </span>
              <span className="text-[11px] text-muted-foreground">{CURRENT_WORKSPACE.name}</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Eye className="size-3" /> 1.2K views · Just now
              </span>
            </div>
          </div>
        </div>
      )

    case "x":
      return (
        <div className="overflow-hidden rounded-xl bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-foreground/10">
          <div className="flex gap-2.5">
            <Avatar />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[13px]">
                <span className="font-medium text-foreground">{CURRENT_WORKSPACE.name}</span>
                <span className="text-muted-foreground">@easylife · now</span>
              </div>
              <CaptionText text={combinedCaption} />
              {variant.link && <span className="truncate text-[12px] text-brand">{variant.link}</span>}
              {media.length > 0 && (
                <div className="mt-1 overflow-hidden rounded-lg">
                  <MediaFrame media={media} aspect="aspect-video" />
                </div>
              )}
              <div className="mt-1.5 flex items-center gap-5 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="size-3.5" /> 12
                </span>
                <span className="flex items-center gap-1.5">
                  <Repeat2 className="size-3.5" /> 4
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="size-3.5" /> 38
                </span>
              </div>
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}
