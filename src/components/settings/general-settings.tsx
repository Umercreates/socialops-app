"use client"

import * as React from "react"
import { Building2, CircleCheck, CircleAlert, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDashboardViewMode } from "@/lib/dashboard-view-mode-context"

const TIMEZONES = ["Pakistan Time", "Pacific Time (US)", "Mountain Time (US)", "Central Time (US)", "Eastern Time (US)", "UTC", "Central European Time"]
const LANGUAGES = ["en", "es", "fr", "de", "pt"]
const LANGUAGE_LABEL: Record<string, string> = { en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese" }
const DEMO_BUSINESS_NAME = "EasyLife Technologies"
const DEMO_TIMEZONE = "Pakistan Time"

/** In Client Mode, real workspace-scoped business settings - persisted via
 * /api/workspace-settings (the workspaces.name column for business name,
 * workspace_settings for the rest). In Demo Mode, a realistic pre-filled
 * example that saves only to local state - never touches the real
 * workspace row, so a demo click can't overwrite the client's own
 * business name. */
export function GeneralSettings() {
  const { mode } = useDashboardViewMode()
  const [businessName, setBusinessName] = React.useState(() => (mode === "demo" ? DEMO_BUSINESS_NAME : ""))
  const [timezone, setTimezone] = React.useState(() => (mode === "demo" ? DEMO_TIMEZONE : TIMEZONES[0]))
  const [language, setLanguage] = React.useState(LANGUAGES[0])
  const [loading, setLoading] = React.useState(() => mode !== "demo")
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Mode-switch (not just first mount) needs to reset these fields too - the
  // render-time "adjust state from a changed prop" pattern, so it isn't
  // itself a setState-in-effect. The client-mode fetch below still owns
  // async loading via its own effect.
  const [prevMode, setPrevMode] = React.useState(mode)
  if (mode !== prevMode) {
    setPrevMode(mode)
    if (mode === "demo") {
      setBusinessName(DEMO_BUSINESS_NAME)
      setTimezone(DEMO_TIMEZONE)
      setLanguage(LANGUAGES[0])
      setLoading(false)
    } else {
      setLoading(true)
    }
  }

  React.useEffect(() => {
    if (mode !== "client") return

    let cancelled = false

    async function load() {
      setLoading(true)
      const data = await fetch("/api/workspace-settings", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
      if (cancelled) return
      if (data) {
        setBusinessName(data.workspaceName ?? "")
        if (data.settings?.timezone) setTimezone(data.settings.timezone)
        if (data.settings?.defaultLanguage) setLanguage(data.settings.defaultLanguage)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [mode])

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    if (mode === "demo") {
      // Demo save is local-only, never persisted or sent anywhere.
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return
    }

    try {
      const res = await fetch("/api/workspace-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ workspaceName: businessName, timezone, defaultLanguage: language }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to save settings.")
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Couldn't reach the server.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="gap-5 px-4 py-4 sm:px-5 sm:py-5">
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-xl bg-muted ring-1 ring-border">
            <Building2 className="size-5 text-muted-foreground" strokeWidth={1.75} />
          </span>
          <Button type="button" variant="outline" size="sm" disabled>
            Upload logo
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="business-name">Business name</Label>
            <Input id="business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="h-9" disabled={loading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={(value) => value && setTimezone(value)} disabled={loading}>
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
            <Select value={language} onValueChange={(value) => value && setLanguage(value)} disabled={loading}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {LANGUAGE_LABEL[lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Button type="submit" disabled={loading || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
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
