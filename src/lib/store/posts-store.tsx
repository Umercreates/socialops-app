"use client"

import * as React from "react"
import type { Post, PostStatus } from "@/types"
import { ALL_SEED_POSTS } from "@/lib/data/posts"
import { createListStore } from "./create-list-store"

const { Provider, useRawStore } = createListStore<Post>(ALL_SEED_POSTS)
export const PostsProvider = Provider

let idCounter = 0
export function generatePostId() {
  idCounter += 1
  return `post_new_${Date.now()}_${idCounter}`
}

export function usePosts() {
  const { items, setItems } = useRawStore()

  const addPost = React.useCallback(
    (post: Post) => {
      setItems((prev) => [post, ...prev])
    },
    [setItems]
  )

  const updatePost = React.useCallback(
    (id: string, patch: Partial<Post>) => {
      setItems((prev) =>
        prev.map((post) => (post.id === id ? { ...post, ...patch, updatedAt: new Date().toISOString() } : post))
      )
    },
    [setItems]
  )

  const removePost = React.useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((post) => post.id !== id))
    },
    [setItems]
  )

  const duplicatePost = React.useCallback(
    (id: string) => {
      setItems((prev) => {
        const original = prev.find((post) => post.id === id)
        if (!original) return prev
        const now = new Date().toISOString()
        const copy: Post = {
          ...original,
          id: generatePostId(),
          title: `${original.title} (copy)`,
          status: "draft",
          scheduledFor: undefined,
          publishedAt: undefined,
          analytics: undefined,
          failureReason: undefined,
          createdAt: now,
          updatedAt: now,
        }
        return [copy, ...prev]
      })
    },
    [setItems]
  )

  const setStatus = React.useCallback(
    (id: string, status: PostStatus) => {
      updatePost(id, { status })
    },
    [updatePost]
  )

  return { posts: items, addPost, updatePost, removePost, duplicatePost, setStatus }
}
