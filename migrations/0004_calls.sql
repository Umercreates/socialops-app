-- Phase 5: Real OmniDimension-backed Call Agent persistence. Additive only.
-- Call Agent previously had no backend at all (pure client-side mock store) -
-- this table is the first real, workspace-scoped, provider-backed record of
-- an actual (or queued) call.

CREATE TABLE IF NOT EXISTS socialops.calls (
  id                    UUID PRIMARY KEY,
  workspace_id          UUID NOT NULL REFERENCES socialops.workspaces(id) ON DELETE CASCADE,
  lead_id               UUID REFERENCES socialops.leads(id) ON DELETE SET NULL,
  provider              TEXT NOT NULL DEFAULT 'omnidimension',
  provider_call_id      TEXT,
  to_number             TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'queued'
                          CHECK (status IN (
                            'queued', 'pending-approval', 'dispatched', 'in-progress',
                            'completed', 'no-answer', 'busy', 'failed', 'blocked'
                          )),
  block_reason          TEXT,
  requested_by_user_id  UUID REFERENCES socialops.users(id) ON DELETE SET NULL,
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  dispatched_at         TIMESTAMPTZ,
  started_at            TIMESTAMPTZ,
  ended_at              TIMESTAMPTZ,
  duration_seconds      INTEGER,
  transcript            JSONB NOT NULL DEFAULT '[]',
  summary               JSONB,
  sentiment             TEXT,
  extracted_variables   JSONB NOT NULL DEFAULT '{}',
  last_error            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calls_workspace ON socialops.calls(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_lead ON socialops.calls(lead_id);
-- One workspace's provider_call_id must map back to exactly one call, so the
-- webhook (which only knows the provider's own call id, not our UUID) can
-- resolve it unambiguously without scanning every workspace.
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_provider_call_id
  ON socialops.calls(provider, provider_call_id) WHERE provider_call_id IS NOT NULL;

INSERT INTO socialops.schema_migrations (version) VALUES ('0004_calls')
ON CONFLICT (version) DO NOTHING;

COMMIT;
