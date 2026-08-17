-- Phase 6: Real automation execution engine. Additive only.
-- Adds a dedupe key to automation_runs so the same underlying event (an
-- inbound message, a call completion, etc.) can never fire the same
-- automation twice, even under a retry or a duplicate webhook delivery.

ALTER TABLE socialops.automation_runs ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_runs_dedupe
  ON socialops.automation_runs(automation_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

INSERT INTO socialops.schema_migrations (version) VALUES ('0005_automation_runs_dedupe')
ON CONFLICT (version) DO NOTHING;

COMMIT;
