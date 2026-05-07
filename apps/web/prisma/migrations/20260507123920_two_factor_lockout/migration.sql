-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'invited', 'disabled');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('pending', 'verified', 'degraded', 'disabled');

-- CreateEnum
CREATE TYPE "MailboxStatus" AS ENUM ('active', 'inactive', 'disabled');

-- CreateEnum
CREATE TYPE "AliasType" AS ENUM ('custom', 'service', 'disposable', 'catch_all_generated');

-- CreateEnum
CREATE TYPE "AliasStatus" AS ENUM ('active', 'disabled', 'expired', 'quarantined');

-- CreateEnum
CREATE TYPE "RoutingAction" AS ENUM ('forward', 'quarantine', 'drop', 'worker', 'label');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecretEncrypted" TEXT,
    "twoFactorFailedAttempts" INTEGER NOT NULL DEFAULT 0,
    "twoFactorLockedUntil" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "DomainStatus" NOT NULL DEFAULT 'pending',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mailbox" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "localPart" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "inboxDestination" TEXT,
    "sendEnabled" BOOLEAN NOT NULL DEFAULT false,
    "receiveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "MailboxStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mailbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alias" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "localPart" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "destinationMailboxId" TEXT,
    "type" "AliasType" NOT NULL DEFAULT 'custom',
    "status" "AliasStatus" NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingRule" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "aliasId" TEXT,
    "action" "RoutingAction" NOT NULL,
    "conditionJson" JSONB NOT NULL,
    "destinationJson" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "messageId" TEXT,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "aliasId" TEXT,
    "mailboxId" TEXT,
    "subjectHash" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mailboxId" TEXT,
    "aiBodyAccess" BOOLEAN NOT NULL DEFAULT false,
    "aiMetadataAccess" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "phishingScoreEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_domain_key" ON "Domain"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Mailbox_address_key" ON "Mailbox"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Mailbox_domainId_localPart_key" ON "Mailbox"("domainId", "localPart");

-- CreateIndex
CREATE UNIQUE INDEX "Alias_address_key" ON "Alias"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Alias_domainId_localPart_key" ON "Alias"("domainId", "localPart");

-- CreateIndex
CREATE UNIQUE INDEX "AiPreference_userId_mailboxId_key" ON "AiPreference"("userId", "mailboxId");

-- AddForeignKey
ALTER TABLE "Mailbox" ADD CONSTRAINT "Mailbox_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailbox" ADD CONSTRAINT "Mailbox_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alias" ADD CONSTRAINT "Alias_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alias" ADD CONSTRAINT "Alias_destinationMailboxId_fkey" FOREIGN KEY ("destinationMailboxId") REFERENCES "Mailbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alias" ADD CONSTRAINT "Alias_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingRule" ADD CONSTRAINT "RoutingRule_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingRule" ADD CONSTRAINT "RoutingRule_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "Alias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_aliasId_fkey" FOREIGN KEY ("aliasId") REFERENCES "Alias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "Mailbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPreference" ADD CONSTRAINT "AiPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPreference" ADD CONSTRAINT "AiPreference_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "Mailbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;
