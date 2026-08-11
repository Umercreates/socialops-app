import { cn } from "@/lib/utils"

interface WhatsAppIconProps {
  size?: number
  className?: string
}

/** Composed primitive, not a reproduction of the official WhatsApp logo —
 * same approach as `PlatformIcon` for the social platforms. */
export function WhatsAppIcon({ size = 18, className }: WhatsAppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <circle cx="12" cy="12" r="11" fill="#25D366" />
      <path
        d="M7 17.5l.85-3.1a5.9 5.9 0 1 1 2.3 2.27L7 17.5Z"
        stroke="white"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9.6 9.9c.15-.4.3-.4.45-.4h.35c.1 0 .25 0 .35.3.15.4.5 1.25.55 1.35.05.1.08.2 0 .35-.35.6-.7.7-.5 1 .4.65 1 1.15 1.6 1.4.2.1.3.05.4-.05.15-.15.5-.6.65-.8.15-.2.3-.15.5-.1.2.1 1.3.6 1.5.7.2.1.35.15.4.25.05.15.05.55-.15 1.05-.2.5-1.15.95-1.55.95-.4 0-.9.05-2.85-1.2-1.95-1.2-2.5-2.9-2.6-3.1-.1-.2-.85-1.15-.85-1.6 0-.45.2-.65.35-.8Z"
        fill="white"
      />
    </svg>
  )
}
