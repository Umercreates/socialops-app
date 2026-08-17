import type { Metadata } from "next"
import Link from "next/link"
import { CircleCheck, Circle, Plug, Share2, Users, PencilLine, Contact, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAuth } from "@/lib/auth/guard"
import { listSocialAccounts } from "@/lib/platform/social-accounts"
import { listPosts } from "@/lib/platform/posts"
import { listWorkspaceMembers } from "@/lib/platform/team"
import { getBusinessAnalytics, getSetupProgress } from "@/lib/platform/business-analytics"
import { PROVIDER_REGISTRY } from "@/lib/integrations/providers"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Getting Started — EasyLife" }

interface OnboardingStep {
  title: string
  description: string
  done: boolean
  href: string
  cta: string
  icon: typeof Plug
}

export default async function OnboardingPage() {
  const crmMode = process.env.CRM_MODE === "database" ? "database" : "demo"
  if (crmMode !== "database") {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-center text-sm text-muted-foreground">
        Getting Started is available once this workspace is running on the real database backend.
      </div>
    )
  }

  const auth = await requireAuth()
  if (!auth.ok) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <p className="text-sm text-muted-foreground">Your session has expired. Please sign in again.</p>
      </div>
    )
  }

  const { workspaceId } = auth.ctx
  const totalProviders = Object.keys(PROVIDER_REGISTRY).length
  const [accounts, posts, members, analytics, setup] = await Promise.all([
    listSocialAccounts(workspaceId),
    listPosts(workspaceId),
    listWorkspaceMembers(workspaceId),
    getBusinessAnalytics(workspaceId),
    getSetupProgress(workspaceId, totalProviders),
  ])

  const steps: OnboardingStep[] = [
    {
      title: "Connect a provider",
      description: "Link a social platform, WhatsApp, or your AI provider so EasyLife has something real to work with.",
      done: setup.hasLiveProvider,
      href: "/dashboard/integrations",
      cta: "Go to Integrations",
      icon: Plug,
    },
    {
      title: "Select an account to publish to",
      description: "Once a social provider is connected, choose which Page, profile, or channel EasyLife publishes to.",
      done: accounts.length > 0,
      href: "/dashboard/accounts",
      cta: "View accounts",
      icon: Share2,
    },
    {
      title: "Invite your team",
      description: "Bring in teammates with the right role so they can help manage content, leads, and calls.",
      done: members.length > 1,
      href: "/dashboard/settings",
      cta: "Invite teammates",
      icon: Users,
    },
    {
      title: "Create your first post",
      description: "Draft or schedule a post to a connected account.",
      done: posts.length > 0,
      href: "/dashboard/create",
      cta: "Create a post",
      icon: PencilLine,
    },
    {
      title: "Capture your first lead",
      description: "Leads come in from WhatsApp, connected socials, or manual entry once things are connected.",
      done: analytics.leads.total > 0,
      href: "/dashboard/leads",
      cta: "View leads",
      icon: Contact,
    },
  ]

  const doneCount = steps.filter((s) => s.done).length

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Getting started</h2>
        <p className="text-sm text-muted-foreground">
          {doneCount === steps.length
            ? "You've completed every setup step - EasyLife is fully set up."
            : `${doneCount}/${steps.length} steps complete. Finish these to get the most out of EasyLife.`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {steps.map((step) => (
          <Card key={step.title} className={cn("flex-row items-center gap-4 px-4 py-4 sm:px-5", step.done && "opacity-70")}>
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                step.done ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              )}
            >
              {step.done ? <CircleCheck className="size-4.5" /> : <step.icon className="size-4.5" strokeWidth={1.75} />}
            </span>
            <CardHeader className="flex-1 gap-0.5 p-0">
              <CardTitle className="text-sm">{step.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </CardHeader>
            <CardContent className="p-0">
              {step.done ? (
                <span className="flex items-center gap-1 text-xs font-medium text-success">
                  <CircleCheck className="size-3.5" />
                  Done
                </span>
              ) : (
                <Link href={step.href} prefetch={false} className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                  {step.cta}
                  <ArrowRight className="size-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {doneCount < steps.length && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Circle className="size-3" />
          Steps stay visible so you can revisit them any time - nothing here blocks you from using the rest of EasyLife.
        </p>
      )}
    </div>
  )
}
