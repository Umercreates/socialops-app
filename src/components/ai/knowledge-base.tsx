"use client"

import * as React from "react"
import { FileText, Globe, HelpCircle, Package, DollarSign, Upload, Trash2, Loader2, CircleCheck, Info } from "lucide-react"
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
import { StatusBadge } from "@/components/dashboard/status-badge"
import { generateKnowledgeId, useKnowledgeSources } from "@/lib/store/knowledge-store"
import { formatRelativeTime } from "@/lib/format"
import { MOCK_NOW } from "@/lib/data/constants"
import type { KnowledgeSourceStatus, KnowledgeSourceType } from "@/types"
import type { LucideIcon } from "lucide-react"

const TYPE_ICON: Record<KnowledgeSourceType, LucideIcon> = {
  pdf: FileText,
  document: FileText,
  website: Globe,
  faq: HelpCircle,
  product: Package,
  service: Package,
  pricing: DollarSign,
}

const TYPE_LABEL: Record<KnowledgeSourceType, string> = {
  pdf: "PDF",
  document: "Document",
  website: "Website",
  faq: "FAQ",
  product: "Product",
  service: "Service",
  pricing: "Pricing",
}

const STATUS_TONE: Record<KnowledgeSourceStatus, "success" | "warning" | "error"> = {
  ready: "success",
  processing: "warning",
  failed: "error",
}

export function KnowledgeBase() {
  const { sources, addSource, removeSource } = useKnowledgeSources()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<KnowledgeSourceType>("document")

  function handleUpload(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    addSource({
      id: generateKnowledgeId(),
      name: name.trim(),
      type,
      status: "processing",
      addedAt: new Date().toISOString(),
    })
    setName("")
    setType("document")
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        This prepares the frontend for real retrieval later — nothing here is embedded, indexed, or searchable yet.
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{sources.length} sources</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />} nativeButton={false}>
            <Upload />
            Upload knowledge
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>Upload knowledge</DialogTitle>
                <DialogDescription>Add a source name and type — this simulates ingestion for the demo.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="kb-name">Name</Label>
                <Input id="kb-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Service pricing 2026.pdf" className="h-9" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as KnowledgeSourceType)}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABEL) as KnowledgeSourceType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!name.trim()}>
                  Upload
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col divide-y divide-border rounded-xl bg-card ring-1 ring-foreground/10">
        {sources.map((source) => {
          const Icon = TYPE_ICON[source.type]
          return (
            <div key={source.id} className="flex items-center gap-3 px-3.5 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-foreground">{source.name}</span>
                <span className="text-xs text-muted-foreground">
                  {TYPE_LABEL[source.type]} · added {formatRelativeTime(source.addedAt, MOCK_NOW)}
                </span>
              </div>
              <StatusBadge tone={STATUS_TONE[source.status]} className="shrink-0">
                {source.status === "processing" && <Loader2 className="size-3 animate-spin" />}
                {source.status === "ready" && <CircleCheck className="size-3" />}
                {source.status === "processing" ? "Processing" : source.status === "ready" ? "Ready" : "Failed"}
              </StatusBadge>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Remove source"
                onClick={() => removeSource(source.id)}
              >
                <Trash2 />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
