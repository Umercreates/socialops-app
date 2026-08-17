-- Phase 8: real, persistent meetings - previously demo-only, in-memory
-- state (src/lib/store/meetings-store.tsx) with no DB table at all.
-- Workspace/lead-scoped; calendar_id/external_event_id/event_url/
-- meet_link are all null until a real Google Calendar event genuinely
-- exists - never fabricated.

CREATE TABLE IF NOT EXISTS socialops.meetings (
  id                   UUID PRIMARY KEY,
  workspace_id         UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  lead_id              UUID REFERENCES socialops.leads(id) ON DELETE SET NULL,
  title                TEXT NOT NULL,
  description          TEXT,
  start_time           TIMESTAMPTZ NOT NULL,
  end_time             TIMESTAMPTZ NOT NULL,
  timezone             TEXT NOT NULL,
  attendee_emails      TEXT[] NOT NULL DEFAULT '{}',
  assigned_to_user_id  UUID REFERENCES socialops.users(id) ON DELETE SET NULL,
  status               TEXT NOT NULL DEFAULT 'scheduled',
  calendar_id          TEXT,
  external_event_id    TEXT,
  event_url            TEXT,
  meet_link            TEXT,
  error_message        TEXT,
  created_by_user_id   UUID REFERENCES socialops.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_workspace ON socialops.meetings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meetings_lead ON socialops.meetings(lead_id);

INSERT INTO socialops.schema_migrations (version) VALUES ('0009_meetings')
ON CONFLICT (version) DO NOTHING;

COMMIT;
