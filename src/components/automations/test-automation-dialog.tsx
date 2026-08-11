"use client"

import * as React from "react"
import { CircleCheck, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Automation } from "@/types"
import { cn } from "@/lib/utils"

interface TestAutomationDialogProps {
  automation: Automation | null
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function TestAutomationDialog({ automation, onOpenChange, onComplete }: TestAutomationDialogProps) {
  const [step, setStep] = React.useState(0)

  // Reset synchronously during render when a new automation starts testing;
  // the timer subscription itself stays in an effect below.
  const [prevAutomation, setPrevAutomation] = React.useState(automation)
  if (automation !== prevAutomation) {
    setPrevAutomation(automation)
    setStep(0)
  }

  React.useEffect(() => {
    if (!automation) return
    const timers = [1, 2, 3].map((n) => setTimeout(() => setStep(n), n * 550))
    return () => timers.forEach(clearTimeout)
  }, [automation])

  React.useEffect(() => {
    if (step === 3 && automation) onComplete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  if (!automation) return null

  const steps = [
    { label: "Trigger matched", detail: automation.trigger.label },
    { label: "Condition evaluated", detail: automation.condition.label },
    { label: "Action executed", detail: automation.action.label },
  ]

  return (
    <Dialog open={Boolean(automation)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Testing “{automation.name}”</DialogTitle>
          <DialogDescription>Simulated against sample data — nothing real is sent.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {steps.map((item, index) => {
            const isDone = step > index
            const isActive = step === index
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full",
                    isDone ? "bg-success/10 text-success" : isActive ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? <CircleCheck className="size-4" /> : isActive ? <Loader2 className="size-3.5 animate-spin" /> : <span className="size-1.5 rounded-full bg-current" />}
                </span>
                <div className="flex flex-col">
                  <span className={cn("text-sm", isDone || isActive ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.detail}</span>
                </div>
              </div>
            )
          })}
        </div>

        {step === 3 && (
          <div className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
            Automation would fire successfully on matching activity.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
