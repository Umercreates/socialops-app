"use client"

import * as React from "react"
import { Loader2, CircleAlert, CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FacebookPage {
  id: string
  name: string
}

/** Which Page this workspace publishes to - a workspace's Facebook OAuth
 * token can manage several Pages, so this is a required extra step beyond
 * "Connect Account" before publishing can work at all. */
export function FacebookPageSelector({ canManage }: { canManage: boolean }) {
  const [pages, setPages] = React.useState<FacebookPage[] | null>(null)
  const [selectedId, setSelectedId] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      const [pagesRes, selectionRes] = await Promise.all([
        fetch("/api/integrations/facebook/pages", { credentials: "same-origin" }),
        fetch("/api/integrations/facebook/page", { credentials: "same-origin" }),
      ])
      if (cancelled) return

      const pagesData = await pagesRes.json().catch(() => null)
      const selectionData = await selectionRes.json().catch(() => null)
      if (cancelled) return

      if (!pagesRes.ok) {
        setError(pagesData?.error ?? "Couldn't load Facebook Pages.")
      } else {
        setPages(pagesData?.pages ?? [])
      }
      if (selectionData?.selection?.pageId) setSelectedId(selectionData.selection.pageId)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave() {
    if (!selectedId) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch("/api/integrations/facebook/page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ pageId: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to save Page selection.")
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
      <Label>Page to publish to</Label>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading Pages...
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : pages && pages.length === 0 ? (
        <p className="text-xs text-muted-foreground">This account doesn&apos;t manage any Facebook Pages.</p>
      ) : canManage ? (
        <>
          <div className="flex items-center gap-2">
            <Select value={selectedId} onValueChange={(v) => v && setSelectedId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a Page" />
              </SelectTrigger>
              <SelectContent>
                {pages?.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={handleSave} disabled={!selectedId || saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </div>
          {saved && (
            <p className="flex items-center gap-1 text-xs text-success">
              <CircleCheck className="size-3.5" />
              Page saved.
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">{pages?.find((p) => p.id === selectedId)?.name ?? "Not selected yet."}</p>
      )}
    </div>
  )
}
