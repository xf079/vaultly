-- RedefineIndex
DROP INDEX "accounts_security_idx";
CREATE INDEX "accounts_status_lockedUntil_idx" ON "accounts"("status", "lockedUntil");

-- RedefineIndex
DROP INDEX "audit_logs_ip_idx";
CREATE INDEX "audit_logs_ipAddress_idx" ON "audit_logs"("ipAddress");

-- RedefineIndex
DROP INDEX "audit_logs_event_created_idx";
CREATE INDEX "audit_logs_eventType_createdAt_idx" ON "audit_logs"("eventType", "createdAt");

-- RedefineIndex
DROP INDEX "audit_logs_account_created_idx";
CREATE INDEX "audit_logs_accountId_createdAt_idx" ON "audit_logs"("accountId", "createdAt");

-- RedefineIndex
DROP INDEX "devices_account_fingerprint_key";
CREATE UNIQUE INDEX "devices_accountId_fingerprint_key" ON "devices"("accountId", "fingerprint");

-- RedefineIndex
DROP INDEX "devices_trusted_until_idx";
CREATE INDEX "devices_trustedUntil_idx" ON "devices"("trustedUntil");

-- RedefineIndex
DROP INDEX "devices_account_id_idx";
CREATE INDEX "devices_accountId_idx" ON "devices"("accountId");

-- RedefineIndex
DROP INDEX "public_keys_account_active_idx";
CREATE INDEX "public_keys_accountId_isActive_idx" ON "public_keys"("accountId", "isActive");

-- RedefineIndex
DROP INDEX "rate_limit_counters_reset_at_idx";
CREATE INDEX "rate_limit_counters_resetAt_idx" ON "rate_limit_counters"("resetAt");

-- RedefineIndex
DROP INDEX "session_revocations_expires_at_idx";
CREATE INDEX "session_revocations_expiresAt_idx" ON "session_revocations"("expiresAt");

-- RedefineIndex
DROP INDEX "session_revocations_jti_idx";
CREATE INDEX "session_revocations_tokenJti_idx" ON "session_revocations"("tokenJti");

-- RedefineIndex
DROP INDEX "trash_deleted_at_idx";
CREATE INDEX "trash_deletedAt_idx" ON "trash"("deletedAt");

-- RedefineIndex
DROP INDEX "trash_account_purged_idx";
CREATE INDEX "trash_accountId_purgedAt_idx" ON "trash"("accountId", "purgedAt");

-- RedefineIndex
DROP INDEX "vault_item_versions_item_version_key";
CREATE UNIQUE INDEX "vault_item_versions_itemId_versionNumber_key" ON "vault_item_versions"("itemId", "versionNumber");

-- RedefineIndex
DROP INDEX "vault_item_versions_item_version_idx";
CREATE INDEX "vault_item_versions_itemId_versionNumber_idx" ON "vault_item_versions"("itemId", "versionNumber");

-- RedefineIndex
DROP INDEX "vault_items_category_vault_idx";
CREATE INDEX "vault_items_category_vaultId_idx" ON "vault_items"("category", "vaultId");

-- RedefineIndex
DROP INDEX "vault_items_favorite_updated_idx";
CREATE INDEX "vault_items_vaultId_favorite_updatedAt_idx" ON "vault_items"("vaultId", "favorite", "updatedAt");

-- RedefineIndex
DROP INDEX "vault_items_vault_deleted_idx";
CREATE INDEX "vault_items_vaultId_deletedAt_idx" ON "vault_items"("vaultId", "deletedAt");

-- RedefineIndex
DROP INDEX "vault_shares_vault_recipient_status_key";
CREATE UNIQUE INDEX "vault_shares_vaultId_sharedWithAccountId_status_key" ON "vault_shares"("vaultId", "sharedWithAccountId", "status");

-- RedefineIndex
DROP INDEX "vault_shares_vault_status_idx";
CREATE INDEX "vault_shares_vaultId_status_idx" ON "vault_shares"("vaultId", "status");

-- RedefineIndex
DROP INDEX "vault_shares_recipient_status_idx";
CREATE INDEX "vault_shares_sharedWithAccountId_status_idx" ON "vault_shares"("sharedWithAccountId", "status");

-- RedefineIndex
DROP INDEX "vaults_type_account_idx";
CREATE INDEX "vaults_type_accountId_idx" ON "vaults"("type", "accountId");

-- RedefineIndex
DROP INDEX "vaults_account_deleted_idx";
CREATE INDEX "vaults_accountId_deletedAt_idx" ON "vaults"("accountId", "deletedAt");
