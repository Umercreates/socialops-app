"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { Post } from "@/types"

interface EditPostDialogProps {
  post: Post | null
  onOpenChange: (open: boolean) => void
  onSave: (postId: string, patch: Pick<Post, "baseCaption" | "baseHashtags" | "variants">) => void
}

export function EditPostDialog({ post, onOpenChange, onSave }: EditPostDialogProps) {
  const [caption, setCaption] = React.useState(post?.baseCaption ?? "")
  const [hashtags, setHashtags] = React.useState(post?.baseHashtags ?? "")

  // Reload the draft synchronously when a different post opens for editing.
  const [prevPostId, setPrevPostId] = React.useState(post?.id ?? null)
  if ((post?.id ?? null) !== prevPostId) {
    setPrevPostId(post?.id ?? null)
    setCaption(post?.baseCaption ?? "")
    setHashtags(post?.baseHashtags ?? "")
  }

  if (!post) return null

  function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!post) return
    onSave(post.id, {
      baseCaption: caption,
      baseHashtags: hashtags,
      variants: post.variants.map((v) => ({ ...v, caption, hashtags })),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={Boolean(post)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
            <DialogDescription>Updates the caption used across all selected platforms.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-caption">Caption</Label>
            <Textarea
              id="edit-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              className="min-h-28 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-hashtags">Hashtags</Label>
            <Input id="edit-hashtags" value={hashtags} onChange={(event) => setHashtags(event.target.value)} className="h-9" />
          </div>

          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
