"use client"

import { RotateCcw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { PLATFORM_FIELDS, type ComposerVariantState } from "@/components/composer/composer-types"
import type { SocialPlatform } from "@/types"

interface VariantEditorProps {
  platforms: SocialPlatform[]
  activeTab: SocialPlatform
  onActiveTabChange: (platform: SocialPlatform) => void
  variants: Record<SocialPlatform, ComposerVariantState>
  onUpdate: (platform: SocialPlatform, patch: Partial<ComposerVariantState>) => void
  onResetToBase: (platform: SocialPlatform) => void
}

export function VariantEditor({
  platforms,
  activeTab,
  onActiveTabChange,
  variants,
  onUpdate,
  onResetToBase,
}: VariantEditorProps) {
  if (platforms.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Select at least one platform above to customize its content.
      </div>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => onActiveTabChange(value as SocialPlatform)}>
      <TabsList className="w-full justify-start overflow-x-auto">
        {platforms.map((platform) => (
          <TabsTrigger key={platform} value={platform} className="gap-1.5">
            <PlatformIcon platform={platform} size={14} />
            {PLATFORM_LABEL[platform]}
          </TabsTrigger>
        ))}
      </TabsList>

      {platforms.map((platform) => {
        const variant = variants[platform]
        const fields = PLATFORM_FIELDS[platform]
        return (
          <TabsContent key={platform} value={platform} className="flex flex-col gap-3.5 pt-3.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`caption-${platform}`}>Caption</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
                onClick={() => onResetToBase(platform)}
              >
                <RotateCcw className="size-3" />
                Use master caption
              </Button>
            </div>
            <Textarea
              id={`caption-${platform}`}
              value={variant.caption}
              onChange={(event) => onUpdate(platform, { caption: event.target.value })}
              placeholder={`Write a caption for ${PLATFORM_LABEL[platform]}…`}
              className="min-h-24 resize-none"
            />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`hashtags-${platform}`}>Hashtags</Label>
              <Input
                id={`hashtags-${platform}`}
                value={variant.hashtags}
                onChange={(event) => onUpdate(platform, { hashtags: event.target.value })}
                placeholder="#yourbrand #socialmedia"
                className="h-9"
              />
            </div>

            {fields.title && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`title-${platform}`}>Video title</Label>
                <Input
                  id={`title-${platform}`}
                  value={variant.title}
                  onChange={(event) => onUpdate(platform, { title: event.target.value })}
                  placeholder="A clear, searchable title"
                  className="h-9"
                />
              </div>
            )}

            {fields.firstComment && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`comment-${platform}`}>First comment</Label>
                <Textarea
                  id={`comment-${platform}`}
                  value={variant.firstComment}
                  onChange={(event) => onUpdate(platform, { firstComment: event.target.value })}
                  placeholder="Drop extra hashtags or a CTA in the first comment…"
                  className="min-h-16 resize-none"
                />
              </div>
            )}

            {fields.link && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`link-${platform}`}>Link</Label>
                <Input
                  id={`link-${platform}`}
                  type="url"
                  value={variant.link}
                  onChange={(event) => onUpdate(platform, { link: event.target.value })}
                  placeholder="https://"
                  className="h-9"
                />
              </div>
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
