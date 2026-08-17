"use client"

import * as React from "react"
import { Loader2, CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Calendar {
  id: string
  name: string
  primary: boolean
}
interface Selection {
  calendarId: string
  calendarName: string | null
  timezone: string
}

/** Which Google Calendar this workspace books meetings on. */
export function GoogleCalendarSelector({ canManage }: { canManage: boolean }) {
  const [calendars, setCalendars] = React.useState<Calendar[] | null>(null)
  const [selectedId, setSelectedId] = React.useState<string>("")
  const [timezone, setTimezone] = React.useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      const [calRes, selRes] = await Promise.all([
        fetch("/api/integrations/google-calendar/calendars", { credentials: "same-origin" }),
        fetch("/api/integrations/google-calendar/calendar", { credentials: "same-origin" }),
      ])
      if (cancelled) return

      const calData = await calRes.json().catch(() => null)
      const selData: { selection: Selection | null } | null = await selRes.json().catch(() => null)
      if (cancelled) return

      if (!calRes.ok) {
        setError(calData?.error ?? "Couldn't load calendars.")
      } else {
        setCalendars(calData?.calendars ?? [])
      }
      if (selData?.selection) {
        setSelectedId(selData.selection.calendarId)
        setTimezone(selData.selection.timezone)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave() {
    if (!selectedId) return
    const calendar = calendars?.find((c) => c.id === selectedId)
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch("/api/integrations/google-calendar/calendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ calendarId: selectedId, calendarName: calendar?.name, timezone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to save calendar selection.")
        return
      }
      setSaved(true)
    } catch {
      setError("Couldn't reach the server.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>Calendar</Label>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading calendars...
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : calendars && calendars.length === 0 ? (
        <p className="text-xs text-muted-foreground">No calendars found on this Google account.</p>
      ) : canManage ? (
        <>
          <div className="flex items-center gap-2">
            <Select value={selectedId} onValueChange={(v) => v && setSelectedId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a calendar" />
              </SelectTrigger>
              <SelectContent>
                {calendars?.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    {cal.name}
                    {cal.primary ? " (primary)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={handleSave} disabled={!selectedId || saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Timezone: {timezone}</p>
          {saved && <p className="text-xs text-success">Calendar saved.</p>}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">{calendars?.find((c) => c.id === selectedId)?.name ?? "Not selected yet."}</p>
      )}
    </div>
  )
}
