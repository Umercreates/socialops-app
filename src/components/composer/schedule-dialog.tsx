"use client"

import * as React from "react"
import { CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (isoDate: string) => void
}

function defaultDateParts() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return {
    date: date.toISOString().slice(0, 10),
    time: "09:00",
  }
}

export function ScheduleDialog({ open, onOpenChange, onConfirm }: ScheduleDialogProps) {
  const defaults = React.useMemo(() => defaultDateParts(), [])
  const [date, setDate] = React.useState(defaults.date)
  const [time, setTime] = React.useState(defaults.time)

  function handleConfirm(event: React.FormEvent) {
    event.preventDefault()
    if (!date || !time) return
    const iso = new Date(`${date}T${time}:00`).toISOString()
    onConfirm(iso)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleConfirm} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Schedule post</DialogTitle>
            <DialogDescription>Choose when this post should go out.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="schedule-date">Date</Label>
              <Input
                id="schedule-date"
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setDate(event.target.value)}
                className="h-9"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="schedule-time">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="h-9"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">
              <CalendarClock />
              Confirm schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
