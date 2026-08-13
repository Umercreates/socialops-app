-- Phase 2 core schema: auth, workspaces, and persistent Leads CRM.
-- Isolated inside a dedicated schema so it can never collide with any other
-- application's tables in this shared `easylife_prod` database.
--
-- UUIDs are generated in application code (crypto.randomUUID()), not by a
-- Postgres extension, so this migration requires zero extensions.
--
-- Enum values mirror the existing TypeScript unions in src/types/index.ts
-- (LeadStage, LeadIntentStatus, LeadActivityType, CallPermission) exactly,
-- so the frontend/Kanban/table UI needs no changes.
--
-- No explicit BEGIN/COMMIT here — the migration runner (src/lib/db/migrate.ts)
-- wraps each file in its own transaction.

CREATE SCHEMA IF NOT EXISTS socialops;

CREATE TABLE IF NOT EXISTS socialops.schema_migrations (
  version     TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS socialops.users (
  id                UUID PRIMARY KEY,
  email             TEXT NOT NULL,
  normalized_email  TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  password_hash     TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS socialops.workspaces (
  id          UUID PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS socialops.workspace_members (
  id            UUID PRIMARY KEY,
  workspace_id  UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES socialops.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'sales')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS socialops.sessions (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES socialops.users(id) ON DELETE CASCADE,
  workspace_id  UUID REFERENCES socialops.workspaces(id) ON DELETE SET NULL,
  token_hash    TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ,
  user_agent    TEXT,
  ip            TEXT
);

CREATE TABLE IF NOT EXISTS socialops.leads (
  id                UUID PRIMARY KEY,
  workspace_id      UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,

  name              TEXT NOT NULL,
  whatsapp_number   TEXT,
  email             TEXT,
  company           TEXT,
  city              TEXT,

  business_type     TEXT,
  location          TEXT,

  source_platform             TEXT NOT NULL DEFAULT 'direct',
  source_campaign             TEXT,
  source_original_post_id     TEXT,
  source_original_post_excerpt TEXT,
  source_original_comment_id  TEXT,
  source_original_comment_excerpt TEXT,
  source_original_conversation_id TEXT,

  service_interested  TEXT,
  requirement         TEXT,
  pain_point          TEXT,
  budget              TEXT,
  timeline            TEXT,
  goal                TEXT,
  decision_maker      TEXT CHECK (decision_maker IN ('yes', 'no', 'unknown')),
  preferred_language  TEXT,
  preferred_call_time TEXT,

  lead_score        INTEGER NOT NULL DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
  stage             TEXT NOT NULL DEFAULT 'new',
  status            TEXT NOT NULL DEFAULT 'cold',
  call_permission   TEXT NOT NULL DEFAULT 'unknown' CHECK (call_permission IN ('yes', 'no', 'unknown')),
  call_status       TEXT,
  meeting_status    TEXT,
  priority          TEXT CHECK (priority IN ('low', 'medium', 'high')),

  assigned_to_user_id  UUID REFERENCES socialops.users(id) ON DELETE SET NULL,
  next_follow_up_at    TIMESTAMPTZ,

  notes             TEXT NOT NULL DEFAULT '',
  tags              TEXT[] NOT NULL DEFAULT '{}',

  last_interaction_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS socialops.lead_activities (
  id              UUID PRIMARY KEY,
  workspace_id    UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES socialops.leads(id) ON DELETE CASCADE,
  actor_user_id   UUID REFERENCES socialops.users(id) ON DELETE SET NULL,
  activity_type   TEXT NOT NULL,
  description     TEXT NOT NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user       ON socialops.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace  ON socialops.workspace_members(workspace_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user     ON socialops.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires  ON socialops.sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_leads_workspace         ON socialops.leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_workspace_stage    ON socialops.leads(workspace_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned           ON socialops.leads(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_created            ON socialops.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_updated            ON socialops.leads(updated_at);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_number    ON socialops.leads(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_leads_email              ON socialops.leads(email);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead       ON socialops.lead_activities(lead_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lead_activities_workspace  ON socialops.lead_activities(workspace_id);

-- Durable login-attempt log backing the rate limiter. A DB table (not
-- in-memory) so limits survive process restarts and hold even if Passenger
-- ever runs more than one worker for this app.
CREATE TABLE IF NOT EXISTS socialops.login_attempts (
  id                UUID PRIMARY KEY,
  normalized_email  TEXT NOT NULL,
  ip                TEXT,
  success           BOOLEAN NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON socialops.login_attempts(normalized_email, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time    ON socialops.login_attempts(ip, created_at);

INSERT INTO socialops.schema_migrations (version) VALUES ('0001_init')
ON CONFLICT (version) DO NOTHING;

COMMIT;
