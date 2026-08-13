import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  markOnly?: boolean
  size?: number
}

/** EasyLife's own mark, cropped from the provided logo — the star icon only,
 * background keyed to transparent so it sits on any surface/theme. */
export function Logo({ className, markOnly = false, size = 26 }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/easylife-mark.png"
        alt="EasyLife"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        priority
      />
      {!markOnly && <span className="text-[15px] font-semibold tracking-tight text-foreground">EasyLife</span>}
    </div>
  )
}
