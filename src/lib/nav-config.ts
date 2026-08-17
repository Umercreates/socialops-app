import {
  LayoutDashboard,
  ListChecks,
  PencilLine,
  CalendarDays,
  Clock,
  CheckCircle2,
  Inbox,
  MessageSquare,
  Share2,
  Workflow,
  BarChart3,
  Sparkles,
  Settings,
  MessagesSquare,
  PhoneCall,
  Contact,
  Plug,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  /** Routes still rendering a placeholder rather than the full module. */
  comingSoon?: boolean
}

export const PRIMARY_NAV: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Getting Started", href: "/dashboard/onboarding", icon: ListChecks },
  { title: "Create Post", href: "/dashboard/create", icon: PencilLine },
  { title: "Content Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { title: "Scheduled Posts", href: "/dashboard/scheduled", icon: Clock },
  { title: "Published Posts", href: "/dashboard/published", icon: CheckCircle2 },
  { title: "Social Inbox", href: "/dashboard/inbox", icon: Inbox },
  { title: "Comments", href: "/dashboard/comments", icon: MessageSquare },
  { title: "Social Accounts", href: "/dashboard/accounts", icon: Share2 },
  { title: "Automations", href: "/dashboard/automations", icon: Workflow },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "AI Assistant", href: "/dashboard/ai", icon: Sparkles },
  { title: "WhatsApp", href: "/dashboard/whatsapp", icon: MessagesSquare },
  { title: "Call Agent", href: "/dashboard/call-agent", icon: PhoneCall },
  { title: "Leads / CRM", href: "/dashboard/leads", icon: Contact },
  { title: "APIs & Integrations", href: "/dashboard/integrations", icon: Plug },
]

export const SETTINGS_NAV_ITEM: NavItem = {
  title: "Settings",
  href: "/dashboard/settings",
  icon: Settings,
}

export const ALL_NAV_ITEMS: NavItem[] = [...PRIMARY_NAV, SETTINGS_NAV_ITEM]
