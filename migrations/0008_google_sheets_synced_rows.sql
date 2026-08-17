-- Phase 7: tracks which spreadsheet row each lead has already synced to,
-- so re-syncing a lead updates its existing row instead of appending a
-- new one every time. One row per (workspace, lead); switching the
-- workspace's selected spreadsheet starts every lead fresh (old mappings
-- point at the old sheet and are simply superseded, not migrated).

CREATE TABLE IF NOT EXISTS socialops.google_sheets_synced_rows (
  id             UUID PRIMARY KEY,
  workspace_id   UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  lead_id        UUID NOT NULL REFERENCES socialops.leads(id) ON DELETE CASCADE,
  spreadsheet_id TEXT NOT NULL,
  worksheet_name TEXT NOT NULL,
  row_number     INTEGER NOT NULL,
  last_synced_at TIMESTAMPTZ,
  last_status    TEXT NOT NULL DEFAULT 'pending',
  last_error     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_google_sheets_synced_rows_workspace ON socialops.google_sheets_synced_rows(workspace_id);

INSERT INTO socialops.schema_migrations (version) VALUES ('0008_google_sheets_synced_rows')
ON CONFLICT (version) DO NOTHING;

COMMIT;
