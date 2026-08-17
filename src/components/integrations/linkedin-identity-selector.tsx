"use client"

import * as React from "react"
import { Loader2, CircleAlert, CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Identity {
  urn: string
  name: string
  type: "member" | "organization"
}

/** Which identity this workspace publishes to LinkedIn as: their own
 * profile, or a company Page they administer. */
export function LinkedInIdentitySelector({ canManage }: { canManage: boolean }) {
  const [identities, setIdentities] = React.useState<Identity[] | null>(null)
  const [selectedUrn, setSelectedUrn] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [orgsWarning, setOrgsWarning] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      const [idRes, selRes] = await Promise.all([
        fetch("/api/integrations/linkedin/identities", { credentials: "same-origin" }),
        fetch("/api/integrations/linkedin/identity", { credentials: "same-origin" }),
      ])
      if (cancelled) return

      const idData = await idRes.json().catch(() => null)
      const selData = await selRes.json().catch(() => null)
      if (cancelled) return

      if (!idRes.ok) {
        setError(idData?.error ?? "Couldn't discover LinkedIn identities.")
      } else {
        const list: Identity[] = []
        if (idData.member?.urn) list.push({ urn: idData.member.urn, name: `${idData.member.name ?? "You"} (your profile)`, type: "member" })
        for (const org of idData.organizations ?? []) list.push({ urn: org.urn, name: org.name, type: "organization" })
        setIdentities(list)
        if (idData.organizationsError) setOrgsWarning(idData.organizationsError)
      }
      if (selData?.selection) setSelectedUrn(selData.selection.authorUrn)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave() {
    const identity = identities?.find((i) => i.urn === selectedUrn)
    if (!identity) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch("/api/integrations/linkedin/identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ authorUrn: identity.urn, authorName: identity.name, authorType: identity.type }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to save LinkedIn identity.")
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
      <Label>Publish as</Label>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading LinkedIn identities...
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : identities && identities.length === 0 ? (
        <p className="text-xs text-muted-foreground">No publishable identity found on this LinkedIn account.</p>
      ) : canManage ? (
        <>
          <div className="flex items-center gap-2">
            <Select value={selectedUrn} onValueChange={(v) => v && setSelectedUrn(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose who to publish as" />
              </SelectTrigger>
              <SelectContent>
                {identities?.map((identity) => (
                  <SelectItem key={identity.urn} value={identity.urn}>
                    {identity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={handleSave} disabled={!selectedUrn || saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </div>
          {orgsWarning && <p className="text-xs text-muted-foreground">Couldn&apos;t load company Pages: {orgsWarning}</p>}
          {saved && (
            <p className="flex items-center gap-1 text-xs text-success">
              <CircleCheck className="size-3.5" />
              Saved.
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">{identities?.find((i) => i.urn === selectedUrn)?.name ?? "Not selected yet."}</p>
      )}
    </div>
  )
}
