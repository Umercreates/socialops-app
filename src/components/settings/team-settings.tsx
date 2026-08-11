"use client"

import * as React from "react"
import { UserPlus, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import type { TeamRole } from "@/types"

const ROLE_LABEL: Record<TeamRole, string> = {
  admin: "Admin",
  manager: "Manager",
  "content-creator": "Content Creator",
  "support-agent": "Support Agent",
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function TeamSettings() {
  const { members, inviteMember, removeMember, setRole } = useTeamMembers()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRoleValue] = React.useState<TeamRole>("content-creator")

  function handleInvite(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !email.trim()) return
    inviteMember(name.trim(), email.trim(), role)
    setName("")
    setEmail("")
    setRoleValue("content-creator")
    setOpen(false)
  }

  return (
    <Card className="gap-4 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{members.length} team members</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />} nativeButton={false}>
            <UserPlus />
            Invite member
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>Invite team member</DialogTitle>
                <DialogDescription>They&apos;ll get an invite email — simulated for this demo.</DialogDescription>
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
                <Select value={role} onValueChange={(v) => setRoleValue(v as TeamRole)}>
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
            <Select value={member.role} onValueChange={(v) => setRole(member.id, v as TeamRole)}>
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
