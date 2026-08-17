-- Phase 6b: workspace-scoped Google Sheets spreadsheet selection. Additive
-- only. One row per workspace - after connecting Google, a client picks
-- which spreadsheet/worksheet CRM data syncs to from the dashboard, never
-- via a global GOOGLE_SHEET_ID env var. PostgreSQL remains the source of
-- truth; this only records where the secondary export target is.

CREATE TABLE IF NOT EXISTS socialops.google_sheets_selections (
  id                   UUID PRIMARY KEY,
  workspace_id         UUID NOT NULL UNIQUE REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  spreadsheet_id       TEXT NOT NULL,
  spreadsheet_name     TEXT,
  worksheet_name       TEXT NOT NULL,
  column_mapping       JSONB NOT NULL DEFAULT '{}',
  selected_by_user_id  UUID REFERENCES socialops.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO socialops.schema_migrations (version) VALUES ('0006_google_sheets_selection')
ON CONFLICT (version) DO NOTHING;

COMMIT;
