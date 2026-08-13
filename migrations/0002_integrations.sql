-- Phase 3: APIs & Integrations Control Center + WhatsApp Cloud API pipeline.
-- Additive only — never touches Phase 2 tables (users/workspaces/sessions/
-- leads/lead_activities). Every table here is workspace-scoped.

CREATE TABLE IF NOT EXISTS socialops.integration_connections (
  id                    UUID PRIMARY KEY,
  workspace_id          UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  provider              TEXT NOT NULL,
  mode                  TEXT NOT NULL DEFAULT 'disabled' CHECK (mode IN ('disabled', 'demo', 'live')),
  status                TEXT NOT NULL DEFAULT 'not_configured'
                          CHECK (status IN ('not_configured', 'configured', 'connected', 'error', 'expired', 'disabled')),
  display_name          TEXT,
  -- Non-secret configuration (e.g. WABA ID, phone number ID) — plain JSON.
  config                JSONB NOT NULL DEFAULT '{}',
  -- Secret fields only, AES-256-GCM encrypted per record (see
  -- src/lib/integrations/crypto.ts). Shape: { [fieldKey]: base64EncryptedBlob }.
  secret_data_encrypted JSONB NOT NULL DEFAULT '{}',
  last_tested_at        TIMESTAMPTZ,
  last_success_at       TIMESTAMPTZ,
  last_error_code       TEXT,
  last_error_message    TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integration_connections_workspace ON socialops.integration_connections(workspace_id);

-- Meaningful integration-management events (never secret values).
CREATE TABLE IF NOT EXISTS socialops.integration_audit_log (
  id             UUID PRIMARY KEY,
  workspace_id   UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  provider       TEXT NOT NULL,
  action         TEXT NOT NULL,
  actor_user_id  UUID REFERENCES socialops.users(id) ON DELETE SET NULL,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_audit_workspace ON socialops.integration_audit_log(workspace_id, created_at);

CREATE TABLE IF NOT EXISTS socialops.whatsapp_accounts (
  id                      UUID PRIMARY KEY,
  workspace_id            UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  integration_connection_id UUID REFERENCES socialops.integration_connections(id) ON DELETE SET NULL,
  phone_number_id         TEXT NOT NULL,
  waba_id                 TEXT NOT NULL,
  display_phone_number    TEXT,
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, phone_number_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_workspace ON socialops.whatsapp_accounts(workspace_id);

CREATE TABLE IF NOT EXISTS socialops.whatsapp_conversations (
  id                    UUID PRIMARY KEY,
  workspace_id          UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  whatsapp_account_id   UUID NOT NULL REFERENCES socialops.whatsapp_accounts(id) ON DELETE CASCADE,
  contact_phone         TEXT NOT NULL,
  contact_name          TEXT,
  lead_id               UUID REFERENCES socialops.leads(id) ON DELETE SET NULL,
  status                TEXT NOT NULL DEFAULT 'bot' CHECK (status IN ('bot', 'escalated', 'human', 'closed')),
  -- Bounded chatbot state machine snapshot (step/collected fields) — small,
  -- structured, never a full raw transcript dump.
  bot_state             JSONB NOT NULL DEFAULT '{}',
  last_message_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (whatsapp_account_id, contact_phone)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_workspace ON socialops.whatsapp_conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_lead      ON socialops.whatsapp_conversations(lead_id);

CREATE TABLE IF NOT EXISTS socialops.whatsapp_messages (
  id                    UUID PRIMARY KEY,
  workspace_id          UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  conversation_id       UUID NOT NULL REFERENCES socialops.whatsapp_conversations(id) ON DELETE CASCADE,
  -- Meta's wamid — the idempotency key for inbound webhook deliveries.
  -- Null for outbound messages sent before the provider assigns one.
  external_message_id   TEXT,
  direction             TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type          TEXT NOT NULL DEFAULT 'text',
  body                  TEXT,
  provider_status       TEXT NOT NULL DEFAULT 'received' CHECK (provider_status IN ('received', 'sent', 'delivered', 'read', 'failed')),
  sender                TEXT NOT NULL DEFAULT 'customer' CHECK (sender IN ('customer', 'bot', 'agent')),
  raw_metadata          JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, external_message_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON socialops.whatsapp_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_workspace    ON socialops.whatsapp_messages(workspace_id);

INSERT INTO socialops.schema_migrations (version) VALUES ('0002_integrations')
ON CONFLICT (version) DO NOTHING;

COMMIT;
