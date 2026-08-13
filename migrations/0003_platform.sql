-- Phase 4: Provider-ready platform architecture. Additive only - never
-- touches Phase 2 (auth/CRM) or Phase 3 (integrations/WhatsApp) tables.
-- Every table here is workspace-scoped except oauth_states/webhook_events,
-- which by nature resolve their workspace only after verification.

-- ---------------------------------------------------------------------------
-- Generic OAuth engine
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS socialops.oauth_states (
  id             UUID PRIMARY KEY,
  workspace_id   UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  provider       TEXT NOT NULL,
  actor_user_id  UUID REFERENCES socialops.users(id) ON DELETE SET NULL,
  state          TEXT NOT NULL UNIQUE,
  code_verifier  TEXT,
  redirect_path  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at     TIMESTAMPTZ NOT NULL,
  used_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON socialops.oauth_states(expires_at);

-- ---------------------------------------------------------------------------
-- Generic webhook engine event log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS socialops.webhook_events (
  id                  UUID PRIMARY KEY,
  provider            TEXT NOT NULL,
  workspace_id        UUID REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  external_event_id   TEXT,
  event_type          TEXT,
  processing_status    TEXT NOT NULL DEFAULT 'received'
                        CHECK (processing_status IN ('received', 'processed', 'ignored', 'failed')),
  -- Small, sanitized summary only - never the full raw payload long-term.
  payload_summary     JSONB,
  error_code          TEXT,
  received_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_dedupe
  ON socialops.webhook_events(provider, external_event_id) WHERE external_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_events_workspace ON socialops.webhook_events(workspace_id, received_at);

-- ---------------------------------------------------------------------------
-- PostgreSQL-backed job queue (no Redis on shared hosting)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS socialops.jobs (
  id             UUID PRIMARY KEY,
  workspace_id   UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,
  payload        JSONB NOT NULL DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  attempts       INTEGER NOT NULL DEFAULT 0,
  max_attempts   INTEGER NOT NULL DEFAULT 3,
  available_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at      TIMESTAMPTZ,
  locked_by      TEXT,
  completed_at   TIMESTAMPTZ,
  last_error     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_claim ON socialops.jobs(status, available_at);
CREATE INDEX IF NOT EXISTS idx_jobs_workspace ON socialops.jobs(workspace_id);

-- ---------------------------------------------------------------------------
-- Social accounts (maps to the existing SocialAccount UI type)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS socialops.social_accounts (
  id                        UUID PRIMARY KEY,
  workspace_id              UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  provider                  TEXT NOT NULL,
  integration_connection_id UUID REFERENCES socialops.integration_connections(id) ON DELETE SET NULL,
  external_account_id       TEXT NOT NULL,
  account_name              TEXT NOT NULL,
  username                  TEXT,
  avatar_url                TEXT,
  account_type              TEXT,
  status                    TEXT NOT NULL DEFAULT 'connected'
                              CHECK (status IN ('connected', 'attention', 'expired', 'disconnected')),
  capabilities              TEXT[] NOT NULL DEFAULT '{}',
  followers                 INTEGER NOT NULL DEFAULT 0,
  followers_delta_30d       INTEGER NOT NULL DEFAULT 0,
  connected_at              TIMESTAMPTZ,
  last_sync_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, provider, external_account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_workspace ON socialops.social_accounts(workspace_id);

-- ---------------------------------------------------------------------------
-- Content publishing backend (maps to the existing Post UI type)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS socialops.posts (
  id             UUID PRIMARY KEY,
  workspace_id   UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES socialops.users(id) ON DELETE SET NULL,
  title          TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'partially_failed', 'failed')),
  base_caption   TEXT NOT NULL DEFAULT '',
  base_hashtags  TEXT NOT NULL DEFAULT '',
  media          JSONB NOT NULL DEFAULT '[]',
  platforms      TEXT[] NOT NULL DEFAULT '{}',
  variants       JSONB NOT NULL DEFAULT '[]',
  scheduled_for  TIMESTAMPTZ,
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_workspace ON socialops.posts(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON socialops.posts(scheduled_for);

-- One row per selected target account per post - a single platform failing
-- to publish never fails the whole post.
CREATE TABLE IF NOT EXISTS socialops.post_targets (
  id                UUID PRIMARY KEY,
  post_id           UUID NOT NULL REFERENCES socialops.posts(id) ON DELETE CASCADE,
  workspace_id      UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES socialops.social_accounts(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'publishing', 'published', 'failed')),
  external_post_id  TEXT,
  error_message     TEXT,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_targets_post ON socialops.post_targets(post_id);
CREATE INDEX IF NOT EXISTS idx_post_targets_workspace ON socialops.post_targets(workspace_id);

-- ---------------------------------------------------------------------------
-- Automation engine (maps to the existing Automation UI type - single
-- trigger/condition/action per automation, matching the current builder UI)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS socialops.automations (
  id             UUID PRIMARY KEY,
  workspace_id   UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'draft')),
  platform       TEXT NOT NULL DEFAULT 'all',
  trigger        JSONB NOT NULL DEFAULT '{}',
  condition      JSONB NOT NULL DEFAULT '{}',
  action         JSONB NOT NULL DEFAULT '{}',
  rules          JSONB NOT NULL DEFAULT '{}',
  runs_last_30d  INTEGER NOT NULL DEFAULT 0,
  last_run_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automations_workspace ON socialops.automations(workspace_id);

CREATE TABLE IF NOT EXISTS socialops.automation_runs (
  id                UUID PRIMARY KEY,
  automation_id     UUID NOT NULL REFERENCES socialops.automations(id) ON DELETE CASCADE,
  workspace_id      UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  trigger_context   JSONB,
  status            TEXT NOT NULL DEFAULT 'running'
                      CHECK (status IN ('running', 'completed', 'blocked', 'failed')),
  error_message     TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON socialops.automation_runs(automation_id, started_at);

-- ---------------------------------------------------------------------------
-- Notifications (maps to the existing Notification UI type)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS socialops.notifications (
  id             UUID PRIMARY KEY,
  workspace_id   UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  -- Null = visible to every member of the workspace.
  user_id        UUID REFERENCES socialops.users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  link           TEXT,
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_workspace ON socialops.notifications(workspace_id, created_at);

-- ---------------------------------------------------------------------------
-- General platform audit log (separate from integration_audit_log, which
-- stays scoped to integration-specific events)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS socialops.audit_log (
  id             UUID PRIMARY KEY,
  workspace_id   UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  actor_user_id  UUID REFERENCES socialops.users(id) ON DELETE SET NULL,
  action         TEXT NOT NULL,
  resource_type  TEXT,
  resource_id    TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_workspace ON socialops.audit_log(workspace_id, created_at);

-- ---------------------------------------------------------------------------
-- Comments backend (maps to the existing Comment UI type)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS socialops.comments (
  id                    UUID PRIMARY KEY,
  workspace_id          UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  social_account_id     UUID REFERENCES socialops.social_accounts(id) ON DELETE SET NULL,
  provider              TEXT NOT NULL,
  external_post_id      TEXT,
  external_comment_id   TEXT,
  parent_comment_id     UUID REFERENCES socialops.comments(id) ON DELETE CASCADE,
  post_excerpt          TEXT,
  author_name           TEXT NOT NULL,
  author_handle         TEXT,
  body                  TEXT NOT NULL,
  sentiment             TEXT NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'question', 'neutral')),
  status                TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'hidden')),
  lead_id               UUID REFERENCES socialops.leads(id) ON DELETE SET NULL,
  marked_as_lead        BOOLEAN NOT NULL DEFAULT false,
  whatsapp_cta_sent_at  TIMESTAMPTZ,
  dm_sent_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, external_comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comments_workspace ON socialops.comments(workspace_id, created_at);

-- ---------------------------------------------------------------------------
-- Workspace settings (secrets stay in integration_connections, never here)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS socialops.workspace_settings (
  id                          UUID PRIMARY KEY,
  workspace_id                UUID NOT NULL UNIQUE REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  timezone                    TEXT NOT NULL DEFAULT 'UTC',
  default_language            TEXT NOT NULL DEFAULT 'en',
  lead_score_threshold        INTEGER NOT NULL DEFAULT 70 CHECK (lead_score_threshold BETWEEN 0 AND 100),
  human_handoff_rules         JSONB NOT NULL DEFAULT '{}',
  notification_preferences    JSONB NOT NULL DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Provider analytics snapshots (kept distinguishable from CRM analytics)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS socialops.provider_analytics_snapshots (
  id                 UUID PRIMARY KEY,
  workspace_id       UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  social_account_id  UUID REFERENCES socialops.social_accounts(id) ON DELETE CASCADE,
  provider           TEXT NOT NULL,
  metric_date        DATE NOT NULL,
  followers          INTEGER,
  impressions        INTEGER,
  reach              INTEGER,
  likes              INTEGER,
  comments           INTEGER,
  shares             INTEGER,
  clicks             INTEGER,
  dm_volume          INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (social_account_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_workspace ON socialops.provider_analytics_snapshots(workspace_id, metric_date);

INSERT INTO socialops.schema_migrations (version) VALUES ('0003_platform')
ON CONFLICT (version) DO NOTHING;

COMMIT;
