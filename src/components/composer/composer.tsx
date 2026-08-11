"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2, CircleCheck, Save, CalendarClock, Send, ArrowRight } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { MediaUploader } from "@/components/composer/media-uploader"
import { PlatformSelector } from "@/components/composer/platform-selector"
import { VariantEditor } from "@/components/composer/variant-editor"
import { PostPreview } from "@/components/composer/post-preview"
import { ScheduleDialog } from "@/components/composer/schedule-dialog"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { ALL_PLATFORMS, EMPTY_VARIANT, type ComposerVariantState } from "@/components/composer/composer-types"
import { usePosts, generatePostId } from "@/lib/store/posts-store"
import type { Post, PostMedia, PostVariant, SocialPlatform } from "@/types"

type PublishFlow = "idle" | "saving-draft" | "scheduling" | "preparing" | "publishing" | "done"

function buildVariants(
  platforms: SocialPlatform[],
  variants: Record<SocialPlatform, ComposerVariantState>
): PostVariant[] {
  return platforms.map((platform) => {
    const v = variants[platform]
    return {
      platform,
      enabled: true,
      caption: v.caption,
      hashtags: v.hashtags,
      ...(v.title ? { title: v.title } : {}),
      ...(v.firstComment ? { firstComment: v.firstComment } : {}),
      ...(v.link ? { link: v.link } : {}),
    }
  })
}

function deriveTitle(baseCaption: string) {
  const trimmed = baseCaption.trim()
  if (!trimmed) return "Untitled post"
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed
}

export function Composer() {
  const { addPost } = usePosts()

  const [baseCaption, setBaseCaption] = React.useState("")
  const [baseHashtags, setBaseHashtags] = React.useState("")
  const [media, setMedia] = React.useState<PostMedia[]>([])
  const [selected, setSelected] = React.useState<Set<SocialPlatform>>(new Set(["instagram"]))
  const [activeTab, setActiveTab] = React.useState<SocialPlatform>("instagram")
  const [variants, setVariants] = React.useState<Record<SocialPlatform, ComposerVariantState>>(
    () => Object.fromEntries(ALL_PLATFORMS.map((p) => [p, { ...EMPTY_VARIANT }])) as Record<SocialPlatform, ComposerVariantState>
  )
  const [previewPlatform, setPreviewPlatform] = React.useState<SocialPlatform>("instagram")

  const [flow, setFlow] = React.useState<PublishFlow>("idle")
  const [scheduleOpen, setScheduleOpen] = React.useState(false)
  const [resultLink, setResultLink] = React.useState<{ href: string; label: string } | null>(null)

  const selectedPlatforms = ALL_PLATFORMS.filter((p) => selected.has(p))

  function togglePlatform(platform: SocialPlatform) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(platform)) {
        next.delete(platform)
      } else {
        next.add(platform)
        setVariants((v) => {
          if (v[platform].caption) return v
          return { ...v, [platform]: { ...v[platform], caption: baseCaption, hashtags: baseHashtags } }
        })
        setActiveTab(platform)
        setPreviewPlatform(platform)
      }
      return next
    })
  }

  function updateVariant(platform: SocialPlatform, patch: Partial<ComposerVariantState>) {
    setVariants((prev) => ({ ...prev, [platform]: { ...prev[platform], ...patch } }))
  }

  function resetVariantToBase(platform: SocialPlatform) {
    updateVariant(platform, { caption: baseCaption, hashtags: baseHashtags })
  }

  function resetComposer() {
    setBaseCaption("")
    setBaseHashtags("")
    setMedia([])
    setSelected(new Set(["instagram"]))
    setActiveTab("instagram")
    setPreviewPlatform("instagram")
    setVariants(Object.fromEntries(ALL_PLATFORMS.map((p) => [p, { ...EMPTY_VARIANT }])) as Record<SocialPlatform, ComposerVariantState>)
    setFlow("idle")
    setResultLink(null)
  }

  function buildBasePost(status: Post["status"], scheduledFor?: string): Post {
    const now = new Date().toISOString()
    return {
      id: generatePostId(),
      title: deriveTitle(baseCaption),
      status,
      baseCaption,
      baseHashtags,
      media,
      platforms: selectedPlatforms,
      variants: buildVariants(selectedPlatforms, variants),
      scheduledFor,
      createdAt: now,
      updatedAt: now,
      author: { id: "usr_maya_reyes", name: "Maya Reyes" },
    }
  }

  async function handleSaveDraft() {
    if (selectedPlatforms.length === 0) return
    setFlow("saving-draft")
    await new Promise((r) => setTimeout(r, 500))
    addPost(buildBasePost("draft"))
    setResultLink({ href: "/dashboard/calendar", label: "View in Calendar" })
    setFlow("done")
  }

  function handleScheduleConfirmed(isoDate: string) {
    ;(async () => {
      setFlow("scheduling")
      await new Promise((r) => setTimeout(r, 600))
      addPost(buildBasePost("scheduled", isoDate))
      setResultLink({ href: "/dashboard/scheduled", label: "View in Scheduled Posts" })
      setFlow("done")
    })()
  }

  async function handlePublishNow() {
    if (selectedPlatforms.length === 0) return
    setFlow("preparing")
    await new Promise((r) => setTimeout(r, 700))
    setFlow("publishing")
    await new Promise((r) => setTimeout(r, 900))
    const post = buildBasePost("published", undefined)
    addPost({
      ...post,
      publishedAt: new Date().toISOString(),
      analytics: { reach: 0, views: 0, likes: 0, comments: 0, shares: 0, engagementRate: 0 },
    })
    setResultLink({ href: "/dashboard/published", label: "View in Published Posts" })
    setFlow("done")
  }

  const isBusy = flow === "saving-draft" || flow === "scheduling" || flow === "preparing" || flow === "publishing"
  const canSubmit = selectedPlatforms.length > 0 && (baseCaption.trim().length > 0 || media.length > 0)

  if (flow === "done" && resultLink) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <Card className="max-w-sm items-center gap-4 px-6 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
            <CircleCheck className="size-6 text-success" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-medium text-foreground">Post saved</h2>
            <p className="text-sm text-muted-foreground">
              This is a demo publish — no content was actually sent to any platform.
            </p>
          </div>
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button render={<Link href={resultLink.href} />} nativeButton={false}>
              {resultLink.label}
              <ArrowRight />
            </Button>
            <Button variant="outline" onClick={resetComposer}>
              Create another post
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Create post</h2>
        <p className="text-sm text-muted-foreground">Draft once, tailor per platform, then schedule or publish.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_23rem]">
        <div className="flex flex-col gap-5">
          <Card className="gap-4 px-4 py-4 sm:px-5 sm:py-5">
            <Label>Media</Label>
            <MediaUploader media={media} onChange={setMedia} />
          </Card>

          <Card className="gap-4 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="base-caption">Master caption</Label>
              <Textarea
                id="base-caption"
                value={baseCaption}
                onChange={(event) => setBaseCaption(event.target.value)}
                placeholder="Write the core message for this post…"
                className="min-h-28 resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="base-hashtags">Hashtags</Label>
              <Input
                id="base-hashtags"
                value={baseHashtags}
                onChange={(event) => setBaseHashtags(event.target.value)}
                placeholder="#yourbrand #socialmedia"
                className="h-9"
              />
            </div>
          </Card>

          <Card className="gap-4 px-4 py-4 sm:px-5 sm:py-5">
            <Label>Platforms</Label>
            <PlatformSelector selected={selected} onToggle={togglePlatform} />
          </Card>

          <Card className="gap-4 px-4 py-4 sm:px-5 sm:py-5">
            <Label>Platform-specific content</Label>
            <VariantEditor
              platforms={selectedPlatforms}
              activeTab={selectedPlatforms.includes(activeTab) ? activeTab : selectedPlatforms[0]}
              onActiveTabChange={(p) => {
                setActiveTab(p)
                setPreviewPlatform(p)
              }}
              variants={variants}
              onUpdate={updateVariant}
              onResetToBase={resetVariantToBase}
            />
          </Card>

          <Card className="flex-row flex-wrap items-center gap-2.5 px-4 py-4 sm:px-5">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isBusy || !canSubmit}>
              {flow === "saving-draft" ? <Loader2 className="animate-spin" /> : <Save />}
              Save draft
            </Button>
            <Button variant="outline" onClick={() => setScheduleOpen(true)} disabled={isBusy || !canSubmit}>
              {flow === "scheduling" ? <Loader2 className="animate-spin" /> : <CalendarClock />}
              Schedule
            </Button>
            <Button className="ml-auto" onClick={handlePublishNow} disabled={isBusy || !canSubmit}>
              {flow === "preparing" || flow === "publishing" ? <Loader2 className="animate-spin" /> : <Send />}
              {flow === "preparing" ? "Preparing…" : flow === "publishing" ? "Publishing…" : "Publish now"}
            </Button>
            {!canSubmit && (
              <p className="w-full text-xs text-muted-foreground">
                Add a caption or media and select at least one platform to continue.
              </p>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-3 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
          <Label>Preview</Label>
          {selectedPlatforms.length === 0 ? (
            <Card className="items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
              Select a platform to see a live preview.
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {selectedPlatforms.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => setPreviewPlatform(platform)}
                    className={
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors " +
                      (previewPlatform === platform
                        ? "border-brand bg-brand/5 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground")
                    }
                  >
                    <PlatformIcon platform={platform} accent size={13} />
                    {PLATFORM_LABEL[platform]}
                  </button>
                ))}
              </div>
              <PostPreview
                platform={selectedPlatforms.includes(previewPlatform) ? previewPlatform : selectedPlatforms[0]}
                variant={variants[selectedPlatforms.includes(previewPlatform) ? previewPlatform : selectedPlatforms[0]]}
                media={media}
              />
            </>
          )}
        </div>
      </div>

      <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} onConfirm={handleScheduleConfirmed} />
    </div>
  )
}
