"use client"

import * as React from "react"
import { Heart, Reply, EyeOff, Trash2, CircleCheck, MessageSquare, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlatformIcon, PLATFORM_LABEL } from "@/components/dashboard/platform-icon"
import { PlatformFilter, type PlatformFilterValue } from "@/components/dashboard/platform-filter"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon"
import { formatRelativeTime } from "@/lib/format"
import { MOCK_NOW } from "@/lib/data/constants"
import { SENTIMENT_ICON, SENTIMENT_TONE, SENTIMENT_LABEL } from "@/lib/comment-sentiment"
import { useComments } from "@/lib/store/comments-store"
import { useConversations } from "@/lib/store/conversations-store"
import { useWhatsAppAccount, useWhatsAppCta } from "@/lib/store/whatsapp-store"
import { buildClickToChatLink, fillMessageTemplate } from "@/lib/integrations/whatsapp"
import type { Comment, CommentSentiment } from "@/types"
import { cn } from "@/lib/utils"

type SentimentFilter = "all" | CommentSentiment | "unanswered"

const SENTIMENT_FILTERS: { value: SentimentFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unanswered", label: "Unanswered" },
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
  { value: "question", label: "Questions" },
]

function initialsFor(name: string) {
  return name
    .split(/[.\s]/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function CommentsPageContent() {
  const { comments, toggleLike, setStatus, removeComment, markAsLead, markWhatsAppCtaSent, markDmSent } = useComments()
  const { startOrFindConversation } = useConversations()
  const { account } = useWhatsAppAccount()
  const { ctaMessage } = useWhatsAppCta()
  const [platformFilter, setPlatformFilter] = React.useState<PlatformFilterValue>("all")
  const [sentimentFilter, setSentimentFilter] = React.useState<SentimentFilter>("all")
  const [replyingId, setReplyingId] = React.useState<string | null>(null)
  const [replyDraft, setReplyDraft] = React.useState("")

  function handleDm(comment: Comment) {
    startOrFindConversation({
      platform: comment.platform,
      contactName: comment.authorName,
      contactHandle: comment.authorHandle,
      openingMessage: `Hey ${comment.authorName.split(" ")[0]}, thanks for your comment on "${comment.postExcerpt}" — following up here!`,
    })
    markDmSent(comment.id)
  }

  function handleSendWhatsAppCta(comment: Comment) {
    const message = fillMessageTemplate(ctaMessage, {
      name: comment.authorName,
      platform: PLATFORM_LABEL[comment.platform],
      campaign: "",
      post: comment.postExcerpt,
      service: "",
      source: "comment",
    })
    const link = buildClickToChatLink(account.number, message)
    startOrFindConversation({
      platform: comment.platform,
      contactName: comment.authorName,
      contactHandle: comment.authorHandle,
      openingMessage: `Continue this conversation on WhatsApp any time: ${link}`,
    })
    markWhatsAppCtaSent(comment.id)
  }

  const visible = comments
    .filter((c) => c.status !== "hidden")
    .filter((c) => platformFilter === "all" || c.platform === platformFilter)
    .filter((c) => {
      if (sentimentFilter === "all") return true
      if (sentimentFilter === "unanswered") return c.status === "open"
      return c.sentiment === sentimentFilter
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  function submitReply(id: string) {
    if (!replyDraft.trim()) return
    setStatus(id, "resolved")
    setReplyingId(null)
    setReplyDraft("")
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Comments</h2>
        <p className="text-sm text-muted-foreground">Everything left on your posts, across every platform.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-muted p-0.5">
          {SENTIMENT_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setSentimentFilter(f.value)}
              className={cn(
                "h-7 shrink-0 rounded-md px-2.5 text-xs font-medium transition-colors",
                sentimentFilter === f.value ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <PlatformFilter value={platformFilter} onChange={setPlatformFilter} />
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          Nothing matches these filters.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((comment) => {
            const SentimentIcon = SENTIMENT_ICON[comment.sentiment]
            return (
              <div key={comment.id} className="flex flex-col gap-2.5 rounded-xl bg-card p-3.5 ring-1 ring-foreground/10">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {initialsFor(comment.authorName)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">{comment.authorName}</span>
                      <span className="text-xs text-muted-foreground">{comment.authorHandle}</span>
                      <PlatformIcon platform={comment.platform} size={12} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">on “{comment.postExcerpt}”</span>
                    </div>
                    <p className="text-sm text-foreground">{comment.body}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={SENTIMENT_TONE[comment.sentiment]}>
                        <SentimentIcon className="size-3" />
                        {SENTIMENT_LABEL[comment.sentiment]}
                      </StatusBadge>
                      {comment.status === "resolved" && <StatusBadge tone="success">Resolved</StatusBadge>}
                      {comment.markedAsLead && <StatusBadge tone="info">Lead</StatusBadge>}
                      {comment.whatsappCtaSentAt && (
                        <StatusBadge tone="success">
                          <WhatsAppIcon size={10} />
                          WhatsApp sent
                        </StatusBadge>
                      )}
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt, MOCK_NOW)}</span>
                      <span className="text-xs text-muted-foreground">· on {PLATFORM_LABEL[comment.platform]}</span>
                    </div>
                  </div>
                  <div
                    className="size-9 shrink-0 rounded-md"
                    style={{ backgroundColor: comment.postThumbnailColor }}
                    aria-hidden="true"
                  />
                </div>

                {replyingId === comment.id && (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      submitReply(comment.id)
                    }}
                    className="flex items-center gap-2 pl-0 sm:pl-12"
                  >
                    <Input
                      autoFocus
                      value={replyDraft}
                      onChange={(event) => setReplyDraft(event.target.value)}
                      placeholder={`Reply to ${comment.authorName}…`}
                      className="h-8 min-w-0 flex-1"
                    />
                    <Button type="submit" size="sm" disabled={!replyDraft.trim()}>
                      Send
                    </Button>
                  </form>
                )}

                <div className="flex flex-wrap items-center gap-1 pl-0 sm:pl-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("gap-1.5", comment.likedByMe && "text-destructive hover:text-destructive")}
                    onClick={() => toggleLike(comment.id)}
                  >
                    <Heart className={cn("size-3.5", comment.likedByMe && "fill-current")} />
                    Like
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      setReplyingId(replyingId === comment.id ? null : comment.id)
                      setReplyDraft("")
                    }}
                  >
                    <Reply className="size-3.5" />
                    Reply
                  </Button>
                  {comment.status !== "resolved" && (
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setStatus(comment.id, "resolved")}>
                      <CircleCheck className="size-3.5" />
                      Resolve
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleDm(comment)}>
                    <MessageSquare className="size-3.5" />
                    {comment.dmSentAt ? "DM sent" : "DM"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleSendWhatsAppCta(comment)}
                    disabled={Boolean(comment.whatsappCtaSentAt)}
                  >
                    <WhatsAppIcon size={13} />
                    {comment.whatsappCtaSentAt ? "WhatsApp sent" : "Send WhatsApp CTA"}
                  </Button>
                  {!comment.markedAsLead && (
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => markAsLead(comment.id)}>
                      <UserPlus className="size-3.5" />
                      Mark Lead
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setStatus(comment.id, "hidden")}>
                    <EyeOff className="size-3.5" />
                    Hide
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => removeComment(comment.id)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
