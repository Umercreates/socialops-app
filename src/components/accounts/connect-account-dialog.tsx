"use client"

import * as React from "react"
import { Loader2, CircleCheck, PlugZap } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { useSocialAccounts } from "@/lib/store/accounts-store"
import type { SocialPlatform } from "@/types"

const ALL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin", "tiktok", "youtube", "x"]

interface ConnectAccountDialogProps {
  trigger?: React.ReactElement
  /** Pre-select a platform when opened from a specific "Connect" card. */
  defaultPlatform?: SocialPlatform
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type Step = "form" | "connecting" | "success"

export function ConnectAccountDialog({ trigger, defaultPlatform, open, onOpenChange }: ConnectAccountDialogProps) {
  const { accounts, connectNew, reconnect } = useSocialAccounts()
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = isControlled ? onOpenChange! : setInternalOpen

  const connectablePlatforms = ALL_PLATFORMS.filter(
    (platform) => !accounts.some((a) => a.platform === platform && a.health !== "disconnected")
  )

  const [platform, setPlatform] = React.useState<SocialPlatform | undefined>(defaultPlatform ?? connectablePlatforms[0])
  const [handle, setHandle] = React.useState("")
  const [step, setStep] = React.useState<Step>("form")

  // Reset the form each time the dialog transitions closed -> open. Adjusting
  // state during render (rather than in an effect) avoids an extra commit.
  const [prevIsOpen, setPrevIsOpen] = React.useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setPlatform(defaultPlatform ?? connectablePlatforms[0])
      setHandle("")
      setStep("form")
    }
  }

  async function handleConnect(event: React.FormEvent) {
    event.preventDefault()
    if (!platform || !handle.trim()) return

    setStep("connecting")
    await new Promise((resolve) => setTimeout(resolve, 1100))

    const existing = accounts.find((a) => a.platform === platform)
    if (existing && existing.health === "disconnected") {
      reconnect(existing.id)
    } else {
      connectNew(platform, handle.trim())
    }
    setStep("success")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} nativeButton={false} />}
      <DialogContent className="sm:max-w-md">
        {step === "form" && (
          <form onSubmit={handleConnect} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Connect a social account</DialogTitle>
              <DialogDescription>
                This is a simulated connection for the demo — no real OAuth flow runs.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="connect-platform">Platform</Label>
              <Select value={platform} onValueChange={(value) => setPlatform(value as SocialPlatform)}>
                <SelectTrigger id="connect-platform" className="h-9 w-full">
                  <SelectValue placeholder="Choose a platform" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_PLATFORMS.map((p) => {
                    const isTaken = !connectablePlatforms.includes(p) && p !== defaultPlatform
                    return (
                      <SelectItem key={p} value={p} disabled={isTaken}>
                        <PlatformIcon platform={p} accent size={14} />
                        {PLATFORM_LABEL[p]}
                        {isTaken && <span className="ml-auto text-xs text-muted-foreground">Connected</span>}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="connect-handle">Username</Label>
              <Input
                id="connect-handle"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="@yourbrand"
                className="h-9"
                required
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={!platform || !handle.trim()}>
                <PlugZap />
                Connect account
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === "connecting" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="size-6 animate-spin text-brand" />
            <p className="text-sm font-medium text-foreground">Connecting {platform && PLATFORM_LABEL[platform]}…</p>
            <p className="text-xs text-muted-foreground">Simulating account authorization</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-success/10">
              <CircleCheck className="size-5.5 text-success" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                {handle || "Account"} connected
              </p>
              <p className="text-xs text-muted-foreground">You can start publishing to this account right away.</p>
            </div>
            <Button className="mt-2 w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
