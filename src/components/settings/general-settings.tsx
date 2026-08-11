"use client"

import * as React from "react"
import { Building2, CircleCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CURRENT_WORKSPACE } from "@/lib/data/workspace"

const TIMEZONES = ["Pacific Time (US)", "Mountain Time (US)", "Central Time (US)", "Eastern Time (US)", "UTC", "Central European Time"]
const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese"]

export function GeneralSettings() {
  const [businessName, setBusinessName] = React.useState(CURRENT_WORKSPACE.name)
  const [timezone, setTimezone] = React.useState(TIMEZONES[0])
  const [language, setLanguage] = React.useState(LANGUAGES[0])
  const [saved, setSaved] = React.useState(false)

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card className="gap-5 px-4 py-4 sm:px-5 sm:py-5">
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-xl bg-muted ring-1 ring-border">
            <Building2 className="size-5 text-muted-foreground" strokeWidth={1.75} />
          </span>
          <Button type="button" variant="outline" size="sm">
            Upload logo
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="business-name">Business name</Label>
            <Input id="business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={(value) => value && setTimezone(value)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Language</Label>
            <Select value={language} onValueChange={(value) => value && setLanguage(value)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Button type="submit">Save changes</Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-success">
              <CircleCheck className="size-4" />
              Saved
            </span>
          )}
        </div>
      </form>
    </Card>
  )
}
