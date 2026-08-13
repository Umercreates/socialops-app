import { pgSchema, text, integer, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core"

/**
 * Drizzle schema mirroring migrations/0001_init.sql exactly. The raw SQL
 * migration is the reviewable source of truth for the actual DDL; this file
 * exists purely for type-safe querying at runtime via drizzle-orm.
 *
 * Isolated in its own `socialops` schema so it can never collide with any
 * other application's tables in the shared `easylife_prod` database.
 */
export const socialops = pgSchema("socialops")

export const schemaMigrations = socialops.table("schema_migrations", {
  version: text("version").primaryKey(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
})

export const users = socialops.table("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  normalizedEmail: text("normalized_email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
})

export const workspaces = socialops.table("workspaces", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const workspaceMembers = socialops.table("workspace_members", {
  id: uuid("id").primaryKey(),
  workspaceId: uuid("workspace_id").notNull(),
  userId: uuid("user_id").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = socialops.table("sessions", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  workspaceId: uuid("workspace_id"),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  userAgent: text("user_agent"),
  ip: text("ip"),
})

export const leads = socialops.table("leads", {
  id: uuid("id").primaryKey(),
  workspaceId: uuid("workspace_id").notNull(),

  name: text("name").notNull(),
  whatsappNumber: text("whatsapp_number"),
  email: text("email"),
  company: text("company"),
  city: text("city"),

  businessType: text("business_type"),
  location: text("location"),

  sourcePlatform: text("source_platform").notNull().default("direct"),
  sourceCampaign: text("source_campaign"),
  sourceOriginalPostId: text("source_original_post_id"),
  sourceOriginalPostExcerpt: text("source_original_post_excerpt"),
  sourceOriginalCommentId: text("source_original_comment_id"),
  sourceOriginalCommentExcerpt: text("source_original_comment_excerpt"),
  sourceOriginalConversationId: text("source_original_conversation_id"),

  serviceInterested: text("service_interested"),
  requirement: text("requirement"),
  painPoint: text("pain_point"),
  budget: text("budget"),
  timeline: text("timeline"),
  goal: text("goal"),
  decisionMaker: text("decision_maker"),
  preferredLanguage: text("preferred_language"),
  preferredCallTime: text("preferred_call_time"),

  leadScore: integer("lead_score").notNull().default(0),
  stage: text("stage").notNull().default("new"),
  status: text("status").notNull().default("cold"),
  callPermission: text("call_permission").notNull().default("unknown"),
  callStatus: text("call_status"),
  meetingStatus: text("meeting_status"),
  priority: text("priority"),

  assignedToUserId: uuid("assigned_to_user_id"),
  nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),

  notes: text("notes").notNull().default(""),
  tags: text("tags").array().notNull().default([]),

  lastInteractionAt: timestamp("last_interaction_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const leadActivities = socialops.table("lead_activities", {
  id: uuid("id").primaryKey(),
  workspaceId: uuid("workspace_id").notNull(),
  leadId: uuid("lead_id").notNull(),
  actorUserId: uuid("actor_user_id"),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const loginAttempts = socialops.table("login_attempts", {
  id: uuid("id").primaryKey(),
  normalizedEmail: text("normalized_email").notNull(),
  ip: text("ip"),
  success: boolean("success").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
