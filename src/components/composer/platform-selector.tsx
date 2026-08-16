"use client"

import { Check } from "lucide-react"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { ALL_PLATFORMS } from "@/components/composer/composer-types"
import type { SocialPlatform } from "@/types"
import { cn } from "@/lib/utils"

interface PlatformSelectorProps {
  selected: Set<SocialPlatform>
  onToggle: (platform: SocialPlatform) => void
  /** Platforms with a real connected account - a platform with no account
   * can't actually be published to, so it's shown but disabled rather than
   * silently selectable and then failing (or worse, doing nothing) later. */
  connectedPlatforms: Set<SocialPlatform>
}

export function PlatformSelector({ selected, onToggle, connectedPlatforms }: PlatformSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {ALL_PLATFORMS.map((platform) => {
        const isSelected = selected.has(platform)
        const isConnected = connectedPlatforms.has(platform)
        return (
          <button
            key={platform}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            title={isConnected ? undefined : "No connected account yet - you can still draft, but scheduling or publishing needs one connected in Integrations"}
            onClick={() => onToggle(platform)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors",
              isSelected
                ? "border-brand bg-brand/5 text-foreground"
                : "border-border text-muted-foreground hover:border-ring/50 hover:text-foreground"
            )}
          >
            {isSelected && (
              <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
            )}
            <PlatformIcon platform={platform} accent size={18} />
            {PLATFORM_LABEL[platform]}
            {!isConnected && <span className="text-[9px] leading-none text-muted-foreground/70">Not connected</span>}
          </button>
        )
      })}
    </div>
  )
}
