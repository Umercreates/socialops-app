-- Phase 7: persistent, server-side media assets. Additive only. Backs the
-- Composer's uploads with a real file on server-side storage plus a
-- workspace-scoped DB record, replacing the previous browser-only object
-- URLs that no server-side job could ever read. storage_key is an opaque
-- identifier the storage adapter resolves (a relative filesystem path for
-- the current local adapter); nothing outside the storage layer parses it.

CREATE TABLE IF NOT EXISTS socialops.media_assets (
  id                   UUID PRIMARY KEY,
  workspace_id         UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  storage_key          TEXT NOT NULL,
  media_type           TEXT NOT NULL,
  mime_type            TEXT NOT NULL,
  size_bytes           INTEGER NOT NULL,
  original_filename    TEXT NOT NULL,
  uploaded_by_user_id  UUID REFERENCES socialops.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_workspace ON socialops.media_assets(workspace_id);

INSERT INTO socialops.schema_migrations (version) VALUES ('0007_media_assets')
ON CONFLICT (version) DO NOTHING;

COMMIT;
