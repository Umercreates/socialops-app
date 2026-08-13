import { Logo } from "@/components/brand/logo"
import { PlatformIcon } from "@/components/dashboard/platform-icon"
import { MessagesSquare, PhoneCall, Sparkles } from "lucide-react"
import type { SocialPlatform } from "@/types"

const SHOWCASE_PLATFORMS: SocialPlatform[] = ["instagram", "tiktok", "linkedin", "youtube", "facebook", "x"]

const FUNNEL_STEPS = [
  { icon: MessagesSquare, label: "WhatsApp" },
  { icon: Sparkles, label: "AI qualifies" },
  { icon: PhoneCall, label: "AI calls" },
]

interface AuthShellProps {
  children: React.ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="flex w-full flex-col justify-between px-6 py-8 sm:px-10 lg:w-[26rem] lg:shrink-0 lg:border-r lg:border-border xl:w-[30rem]">
        <div className="animate-in fade-in-0 slide-in-from-top-1 duration-500">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground lg:text-left">© 2026 EasyLife. All rights reserved.</p>
      </div>

      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-muted/40 lg:flex">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 left-1/2 size-144 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/6 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex w-full max-w-sm flex-col gap-6 px-8 animate-in fade-in-0 zoom-in-95 duration-700">
          <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] ring-1 ring-foreground/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">EasyLife</span>
              <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-success/10 px-2 text-xs font-medium text-success">
                <span className="size-1.5 rounded-full bg-success" />
                6 accounts connected
              </span>
            </div>
            <div className="flex items-center gap-2">
              {SHOWCASE_PLATFORMS.map((platform) => (
                <div key={platform} className="flex size-8 items-center justify-center rounded-lg bg-muted ring-1 ring-border">
                  <PlatformIcon platform={platform} accent size={15} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-semibold tabular-nums text-foreground">531K</span>
                <span className="text-xs text-muted-foreground">Followers</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-semibold tabular-nums text-foreground">86</span>
                <span className="text-xs text-muted-foreground">Posts / 30d</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-semibold tabular-nums text-foreground">6%</span>
                <span className="text-xs text-muted-foreground">Engagement</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
              {FUNNEL_STEPS.map((step, index) => (
                <div key={step.label} className="flex flex-1 items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <step.icon className="size-3.5" strokeWidth={1.75} />
                    </span>
                    <span className="text-xs font-medium text-foreground">{step.label}</span>
                  </div>
                  {index < FUNNEL_STEPS.length - 1 && <div className="h-px flex-1 bg-border" aria-hidden="true" />}
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-sm text-balance text-muted-foreground">
            Every account, every conversation, every lead — qualified by AI, closed by your team.
          </p>
        </div>
      </div>
    </div>
  )
}
