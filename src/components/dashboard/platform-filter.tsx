"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import type { SocialPlatform } from "@/types"

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "youtube", "x"]

export type PlatformFilterValue = SocialPlatform | "all"

interface PlatformFilterProps {
  value: PlatformFilterValue
  onChange: (value: PlatformFilterValue) => void
}

export function PlatformFilter({ value, onChange }: PlatformFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PlatformFilterValue)}>
      <SelectTrigger className="h-8 w-40">
        <SelectValue placeholder="All platforms" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All platforms</SelectItem>
        {ALL_PLATFORMS.map((platform) => (
          <SelectItem key={platform} value={platform}>
            <PlatformIcon platform={platform} accent size={14} />
            {PLATFORM_LABEL[platform]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
