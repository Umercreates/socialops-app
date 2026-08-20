"use client"

import * as React from "react"
import { UserPlus, Trash2, Loader2, CircleAlert, CircleCheck, Copy } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StatusBadge } from "@/components/dashboard/status-badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTeamMembers } from "@/lib/store/settings-store"
import { useDemoMode } from "@/lib/demo-mode-context"
import type { TeamRole } from "@/lib/platform/team"

const ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  sales: "Sales",
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

interface RealMember {
  id: string
  userId: string
  name: string
  email: string
  role: TeamRole
  status: string
}

/** Real, server-side team management - invite creates a genuine user +
 * workspace_members row (no email provider exists, so the one-time
 * temporary password shown after inviting is the real, honest hand-off
 * mechanism, not a fake "invite sent"). Role changes and removal both
 * hit the real, role-enforced API. */
function RealTeamSettings() {
  const [members, setMembers] = React.useState<RealMember[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRoleValue] = React.useState<TeamRole>("sales")
  const [inviting, setInviting] = React.useState(false)
  const [inviteError, setInviteError] = React.useState<string | null>(null)
  const [newCredential, setNewCredential] = React.useState<{ email: string; password: string } | null>(null)
  const [rowError, setRowError] = React.useState<string | null>(null)

  // Reusable refetch (after invite/role-change/remove) - deliberately
  // doesn't touch the loading flag, so those actions just quietly refresh
  // the list rather than re-showing the initial full-page loading state.
  const refreshMembers = React.useCallback(async () => {
    const data = await fetch("/api/team", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
    setMembers(data?.members ?? [])
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      await refreshMembers()
      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [refreshMembers])

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !email.trim()) return
    setInviting(true)
    setInviteError(null)
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data.error ?? "Failed to invite this member.")
        return
      }
      setNewCredential({ email: email.trim(), password: data.temporaryPassword })
      setName("")
      setEmail("")
      setRoleValue("sales")
      setOpen(false)
      await refreshMembers()
    } catch {
      setInviteError("Couldn't reach the server.")
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleChange(memberId: string, newRole: TeamRole) {
    setRowError(null)
    const res = await fetch(`/api/team/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ role: newRole }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setRowError(data?.error ?? "Failed to update role.")
      return
    }
    await refreshMembers()
  }

  async function handleRemove(memberId: string) {
    setRowError(null)
    const res = await fetch(`/api/team/${memberId}`, { method: "DELETE", credentials: "same-origin" })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setRowError(data?.error ?? "Failed to remove this member.")
      return
    }
    await refreshMembers()
  }

  return (
    <Card className="gap-4 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{loading ? "Loading…" : `${members?.length ?? 0} team members`}</span>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (!next) setInviteError(null)
          }}
        >
          <DialogTrigger render={<Button size="sm" />}>
            <UserPlus />
            Add member
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>Add team member</DialogTitle>
                <DialogDescription>
                  No email provider is configured yet, so you&apos;ll get a one-time temporary password to share with them directly.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-name">Name</Label>
                <Input id="invite-name" value={name} onChange={(event) => setName(event.target.value)} className="h-9" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-9" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => v && setRoleValue(v as TeamRole)}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABEL) as TeamRole[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {inviteError && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertDescription>{inviteError}</AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button type="submit" disabled={!name.trim() || !email.trim() || inviting}>
                  {inviting && <Loader2 className="size-4 animate-spin" />}
                  Add member
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {newCredential && (
        <Alert>
          <CircleCheck />
          <AlertDescription className="flex flex-col gap-1">
            <span>
              Account created for <span className="font-medium text-foreground">{newCredential.email}</span>. Share this temporary password with them - it won&apos;t be shown again:
            </span>
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 text-xs">{newCredential.password}</code>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Copy password"
                onClick={() => navigator.clipboard.writeText(newCredential.password)}
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {rowError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{rowError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col divide-y divide-border">
        {members?.map((member) => (
          <div key={member.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <Avatar size="sm">
              <AvatarFallback>{initialsFor(member.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-foreground">{member.name}</span>
              <span className="truncate text-xs text-muted-foreground">{member.email}</span>
            </div>
            {member.status !== "active" && <StatusBadge tone="warning">{member.status}</StatusBadge>}
            <Select value={member.role} onValueChange={(v) => v && handleRoleChange(member.id, v as TeamRole)}>
              <SelectTrigger size="sm" className="h-7 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABEL) as TeamRole[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              aria-label="Remove member"
              onClick={() => handleRemove(member.id)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function TeamSettings() {
  const demoMode = useDemoMode()
  // Hooks below run unconditionally, per Rules of Hooks - the demo/real
  // branch is a return of different JSX, never a skipped hook.
  const { members, inviteMember, removeMember, setRole } = useTeamMembers()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRoleValue] = React.useState<TeamRole>("sales")

  if (!demoMode) return <RealTeamSettings />

  function handleInvite(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !email.trim()) return
    inviteMember(name.trim(), email.trim(), role)
    setName("")
    setEmail("")
    setRoleValue("sales")
    setOpen(false)
  }

  return (
    <Card className="gap-4 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{members.length} team members</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <UserPlus />
            Invite member
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>Invite team member</DialogTitle>
                <DialogDescription>Demo mode — they&apos;ll get an invite email — simulated for this demo.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-name">Name</Label>
                <Input id="invite-name" value={name} onChange={(event) => setName(event.target.value)} className="h-9" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-9" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => v && setRoleValue(v as TeamRole)}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABEL) as TeamRole[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!name.trim() || !email.trim()}>
                  Send invite
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <Avatar size="sm">
              <AvatarFallback>{initialsFor(member.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-foreground">{member.name}</span>
              <span className="truncate text-xs text-muted-foreground">{member.email}</span>
            </div>
            {member.status === "invited" && <StatusBadge tone="warning">Invited</StatusBadge>}
            <Select value={member.role} onValueChange={(v) => v && setRole(member.id, v as TeamRole)}>
              <SelectTrigger size="sm" className="h-7 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABEL) as TeamRole[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              aria-label="Remove member"
              onClick={() => removeMember(member.id)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}
