import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RealSettingsPointerProps {
  icon: LucideIcon
  title: string
  description: string
  href: string
  cta: string
}

/** Some Settings sub-tabs (Integrations, Google Sheets) duplicate a
 * dedicated real page elsewhere in the app. Rather than maintaining two
 * copies of the same real UI (or worse, leaving the mock version's fake
 * Connect/Disconnect controls active here), this points to the one real
 * page that actually does something. */
export function RealSettingsPointer({ icon: Icon, title, description, href, cta }: RealSettingsPointerProps) {
  return (
    <Card className="px-5 py-5">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-1.5 text-[15px]">
          <Icon className="size-4" />
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="px-0">
        <Link href={href} prefetch={false} className="flex w-fit items-center gap-1 text-sm font-medium text-brand hover:underline">
          {cta}
          <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
