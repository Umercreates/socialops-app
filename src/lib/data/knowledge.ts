import type { KnowledgeSource } from "@/types"

export const KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  { id: "kb_1", name: "Service pricing sheet.pdf", type: "pdf", status: "ready", addedAt: "2026-07-02T10:00:00Z" },
  { id: "kb_2", name: "Brand voice guidelines.docx", type: "document", status: "ready", addedAt: "2026-07-05T14:20:00Z" },
  { id: "kb_3", name: "easyland.co", type: "website", status: "ready", addedAt: "2026-07-08T09:00:00Z" },
  { id: "kb_4", name: "Frequently asked questions", type: "faq", status: "ready", addedAt: "2026-07-10T11:30:00Z" },
  { id: "kb_5", name: "Studio session packages", type: "product", status: "ready", addedAt: "2026-07-15T16:00:00Z" },
  { id: "kb_6", name: "Monthly retainer plans", type: "pricing", status: "processing", addedAt: "2026-08-09T13:00:00Z" },
  { id: "kb_7", name: "Content strategy overview.pdf", type: "pdf", status: "failed", addedAt: "2026-08-06T08:45:00Z" },
]
