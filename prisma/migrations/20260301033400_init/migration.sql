-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordEncrypted" TEXT NOT NULL,
    "srpSalt" TEXT NOT NULL,
    "srpVerifier" TEXT NOT NULL,
    "secretKeyFingerprint" TEXT NOT NULL,
    "kdfIterations" INTEGER NOT NULL DEFAULT 100000,
    "passwordSalt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lockedUntil" DATETIME,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "emailVerifiedAt" DATETIME,
    "lastPasswordChangeAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    CONSTRAINT "profiles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "osVersion" TEXT,
    "appVersion" TEXT,
    "biometricEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushToken" TEXT,
    "trustedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trustedUntil" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrentSession" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "devices_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT,
    "eventType" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vaults" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PERSONAL',
    "vaultKey" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "vaults_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vault_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vaultId" TEXT NOT NULL,
    "dataEncrypted" TEXT NOT NULL,
    "metadata" JSONB,
    "category" TEXT NOT NULL,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "currentVersionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "createdById" TEXT,
    "updatedById" TEXT,
    "accountId" TEXT,
    CONSTRAINT "vault_items_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vault_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vault_items_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vault_items_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vault_item_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "dataEncrypted" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vault_item_versions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "vault_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vault_shares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sharedByAccountId" TEXT NOT NULL,
    "sharedWithAccountId" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'VIEW',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME,
    "vaultKeyEncrypted" TEXT NOT NULL,
    "publicKeyUsed" TEXT NOT NULL,
    "acceptedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "vaultId" TEXT NOT NULL,
    CONSTRAINT "vault_shares_sharedByAccountId_fkey" FOREIGN KEY ("sharedByAccountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vault_shares_sharedWithAccountId_fkey" FOREIGN KEY ("sharedWithAccountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vault_shares_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trash" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "vaultId" TEXT,
    "nameEncrypted" TEXT,
    "dataEncrypted" TEXT,
    "deletedBy" TEXT NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purgedAt" DATETIME,
    "isRestored" BOOLEAN NOT NULL DEFAULT false,
    "restoredAt" DATETIME,
    "restoredToVaultId" TEXT,
    CONSTRAINT "trash_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "trash_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "vaults" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "publicKeyPem" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "deviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "public_keys_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "public_keys_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE INDEX "accounts_email_idx" ON "accounts"("email");

-- CreateIndex
CREATE INDEX "accounts_status_lockedUntil_idx" ON "accounts"("status", "lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_accountId_key" ON "profiles"("accountId");

-- CreateIndex
CREATE INDEX "profiles_accountId_idx" ON "profiles"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "devices_fingerprint_key" ON "devices"("fingerprint");

-- CreateIndex
CREATE INDEX "devices_accountId_idx" ON "devices"("accountId");

-- CreateIndex
CREATE INDEX "devices_trustedUntil_idx" ON "devices"("trustedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "devices_accountId_fingerprint_key" ON "devices"("accountId", "fingerprint");

-- CreateIndex
CREATE INDEX "audit_logs_accountId_createdAt_idx" ON "audit_logs"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_eventType_createdAt_idx" ON "audit_logs"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_ipAddress_idx" ON "audit_logs"("ipAddress");

-- CreateIndex
CREATE INDEX "vaults_accountId_deletedAt_idx" ON "vaults"("accountId", "deletedAt");

-- CreateIndex
CREATE INDEX "vaults_type_accountId_idx" ON "vaults"("type", "accountId");

-- CreateIndex
CREATE INDEX "vault_items_vaultId_deletedAt_idx" ON "vault_items"("vaultId", "deletedAt");

-- CreateIndex
CREATE INDEX "vault_items_vaultId_favorite_updatedAt_idx" ON "vault_items"("vaultId", "favorite", "updatedAt");

-- CreateIndex
CREATE INDEX "vault_items_category_vaultId_idx" ON "vault_items"("category", "vaultId");

-- CreateIndex
CREATE INDEX "vault_item_versions_itemId_versionNumber_idx" ON "vault_item_versions"("itemId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vault_item_versions_itemId_versionNumber_key" ON "vault_item_versions"("itemId", "versionNumber");

-- CreateIndex
CREATE INDEX "vault_shares_vaultId_sharedWithAccountId_status_idx" ON "vault_shares"("vaultId", "sharedWithAccountId", "status");

-- CreateIndex
CREATE INDEX "vault_shares_vaultId_status_idx" ON "vault_shares"("vaultId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "vault_shares_vaultId_sharedWithAccountId_status_key" ON "vault_shares"("vaultId", "sharedWithAccountId", "status");

-- CreateIndex
CREATE INDEX "trash_accountId_purgedAt_idx" ON "trash"("accountId", "purgedAt");

-- CreateIndex
CREATE INDEX "trash_deletedAt_idx" ON "trash"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "public_keys_fingerprint_key" ON "public_keys"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "public_keys_deviceId_key" ON "public_keys"("deviceId");

-- CreateIndex
CREATE INDEX "public_keys_accountId_isActive_idx" ON "public_keys"("accountId", "isActive");
