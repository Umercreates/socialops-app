-- Closes a webhook-replay race: recordWebhookEvent's dedupe was a
-- select-then-insert with no DB-level constraint backing it, so truly
-- concurrent redelivery of the same (provider, external_event_id) could
-- both pass the "not found" check and double-process. Partial (excludes
-- NULL external_event_id, which several callers legitimately have) so it
-- never blocks those inserts.

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_provider_external_id
  ON socialops.webhook_events(provider, external_event_id)
  WHERE external_event_id IS NOT NULL;

INSERT INTO socialops.schema_migrations (version) VALUES ('0010_webhook_events_unique')
ON CONFLICT (version) DO NOTHING;

COMMIT;
