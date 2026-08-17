-- Performance pass: indexes for genuinely hot, currently-unindexed lookup
-- patterns, verified against the actual queries that run them (not
-- speculative). Additive only - no existing index touched, no data changed.

-- Every Facebook/Instagram comment webhook delivery (and any future
-- webhook-routed provider) resolves its owning workspace via
-- findSocialAccountByExternalId(provider, externalAccountId) - previously
-- only backed by a bare workspace_id index, meaning this ran as a
-- sequential scan across the whole table on every single delivery.
CREATE INDEX IF NOT EXISTS idx_social_accounts_external_lookup
  ON socialops.social_accounts(provider, external_account_id);

-- ingestComment's idempotency check (provider, external_comment_id) has
-- the same problem - it runs on every inbound comment webhook event,
-- before the row it's deduping against can even be found via an index.
CREATE INDEX IF NOT EXISTS idx_comments_external_lookup
  ON socialops.comments(provider, external_comment_id);

-- automation_runs had an index on (automation_id, started_at) but none on
-- workspace_id alone, despite it being a real NOT NULL column - the
-- Dashboard Home/Analytics aggregate query and any workspace-scoped "list
-- automation runs" read both filter by workspace_id only.
CREATE INDEX IF NOT EXISTS idx_automation_runs_workspace
  ON socialops.automation_runs(workspace_id, status);

-- listConversations orders by (workspace_id, last_message_at DESC) - the
-- existing bare workspace_id index requires a separate sort step once a
-- workspace has more than a handful of conversations. This index matches
-- the query's WHERE + ORDER BY exactly.
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_lastmsg
  ON socialops.whatsapp_conversations(workspace_id, last_message_at DESC);

INSERT INTO socialops.schema_migrations (version) VALUES ('0011_performance_indexes')
ON CONFLICT (version) DO NOTHING;

COMMIT;
