"use client"

import * as React from "react"
import { Bot, Plus, X as XIcon, CircleCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TEAM_MEMBERS } from "@/lib/data/settings"
import { useCallAgentConfig } from "@/lib/store/call-agent-store"
import { useDemoMode } from "@/lib/demo-mode-context"
import { useProviderStatus } from "@/lib/hooks/use-provider-status"
import type { CallMode } from "@/types"

const VOICES = ["Warm & professional (female)", "Confident & friendly (male)", "Neutral (text-only, no voice yet)"]
const LANGUAGES = ["Urdu + English (mixed)", "Urdu", "English", "Spanish", "Arabic"]

const CALL_MODE_LABEL: Record<CallMode, string> = {
  manual: "Manual approval — a teammate starts every call",
  "auto-qualified": "Auto-call qualified leads (future)",
  scheduled: "Scheduled call windows only",
}

export function CallAgentSettings() {
  const { config, update } = useCallAgentConfig()
  const demoMode = useDemoMode()
  const { isLive } = useProviderStatus("google-calendar")
  const calendarConnected = demoMode ? false : isLive
  const [questionDraft, setQuestionDraft] = React.useState("")
  const [saved, setSaved] = React.useState(false)

  function addQuestion() {
    if (!questionDraft.trim()) return
    update({ qualificationQuestions: [...config.qualificationQuestions, questionDraft.trim()] })
    setQuestionDraft("")
  }

  function removeQuestion(index: number) {
    update({ qualificationQuestions: config.qualificationQuestions.filter((_, i) => i !== index) })
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <Card className="gap-4 px-5 py-5">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-1.5 text-[15px]">
            <Bot className="size-4" />
            Agent identity
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 px-0 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-name">Agent name</Label>
            <Input id="agent-name" value={config.agentName} onChange={(event) => update({ agentName: event.target.value })} className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-name">Company name</Label>
            <Input id="company-name" value={config.companyName} onChange={(event) => update({ companyName: event.target.value })} className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Language</Label>
            <Select value={config.language} onValueChange={(v) => v && update({ language: v })}>
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
          <div className="flex flex-col gap-1.5">
            <Label>Voice</Label>
            <Select value={config.voice} onValueChange={(v) => v && update({ voice: v })}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((voice) => (
                  <SelectItem key={voice} value={voice}>
                    {voice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="greeting">Opening greeting</Label>
            <Textarea id="greeting" value={config.greeting} onChange={(event) => update({ greeting: event.target.value })} className="min-h-16 resize-none" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="objective">Call objective</Label>
            <Textarea id="objective" value={config.objective} onChange={(event) => update({ objective: event.target.value })} className="min-h-16 resize-none" />
          </div>
        </CardContent>
      </Card>

      <Card className="gap-4 px-5 py-5">
        <CardHeader className="px-0">
          <CardTitle className="text-[15px]">Qualification questions</CardTitle>
          <p className="text-xs text-muted-foreground">The AI weaves these into conversation naturally — it doesn&apos;t read them as a script.</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-0">
          {config.qualificationQuestions.map((question, index) => (
            <div key={index} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
              <span className="flex-1">{question}</span>
              <button type="button" onClick={() => removeQuestion(index)} aria-label="Remove question">
                <XIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={questionDraft}
              onChange={(event) => setQuestionDraft(event.target.value)}
              placeholder="Add a qualification question…"
              className="h-8 flex-1"
            />
            <Button type="button" size="sm" variant="outline" onClick={addQuestion} disabled={!questionDraft.trim()}>
              <Plus />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Knowledge base for objection handling is shared with the AI Assistant — manage it from the AI Assistant page.
          </p>
        </CardContent>
      </Card>

      <Card className="gap-4 px-5 py-5">
        <CardHeader className="px-0">
          <CardTitle className="text-[15px]">Calling rules</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-col gap-1.5">
            <Label>Minimum lead score to queue for a call</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={config.minimumLeadScore}
              onChange={(event) => update({ minimumLeadScore: Number(event.target.value) })}
              className="h-9 w-32"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Call mode</Label>
            <Select value={config.mode} onValueChange={(v) => v && update({ mode: v as CallMode })}>
              <SelectTrigger className="h-9 w-full sm:w-96">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CALL_MODE_LABEL) as CallMode[]).map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {CALL_MODE_LABEL[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <Label className="text-sm font-normal text-foreground">Require human approval</Label>
              <p className="text-xs text-muted-foreground">A teammate reviews the AI&apos;s call plan before it dials — always on while in Manual Approval mode.</p>
            </div>
            <Switch checked={config.humanApproval} onCheckedChange={(v) => update({ humanApproval: v })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Calling hours start</Label>
              <input
                type="time"
                value={config.callingHoursStart}
                onChange={(event) => update({ callingHoursStart: event.target.value })}
                className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Calling hours end</Label>
              <input
                type="time"
                value={config.callingHoursEnd}
                onChange={(event) => update({ callingHoursEnd: event.target.value })}
                className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Timezone</Label>
              <Input value={config.timezone} onChange={(event) => update({ timezone: event.target.value })} className="h-9" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Maximum call attempts</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={config.maxAttempts}
              onChange={(event) => update({ maxAttempts: Number(event.target.value) })}
              className="h-9 w-32"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Assigned sales person</Label>
            <Select value={config.assignedSalesPerson ?? ""} onValueChange={(v) => v && update({ assignedSalesPerson: v })}>
              <SelectTrigger className="h-9 w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_MEMBERS.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Meetings booked here sync to Google Calendar — {calendarConnected ? "connected" : demoMode ? "not connected in this demo" : "not connected"}.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit">Save changes</Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <CircleCheck className="size-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  )
}
