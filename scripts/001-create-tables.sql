-- Stream Controller Database Schema
-- Based on Prisma schema

-- Create enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STREAMER', 'OPERATOR');
CREATE TYPE "RemoteSessionStatus" AS ENUM ('REQUESTED', 'ACTIVE', 'REJECTED', 'CLOSED', 'EMERGENCY_STOPPED');
CREATE TYPE "CommandStatus" AS ENUM ('QUEUED', 'EXECUTED', 'FAILED');
CREATE TYPE "AgentStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- Create User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create StreamerProfile table
CREATE TABLE "StreamerProfile" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "timezone" TEXT,
    "emergencyPin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreamerProfile_pkey" PRIMARY KEY ("id")
);

-- Create OperatorPermission table
CREATE TABLE "OperatorPermission" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "streamerId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "actions" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorPermission_pkey" PRIMARY KEY ("id")
);

-- Create RemoteSession table
CREATE TABLE "RemoteSession" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "streamerId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "status" "RemoteSessionStatus" NOT NULL,
    "reason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "RemoteSession_pkey" PRIMARY KEY ("id")
);

-- Create CommandLog table
CREATE TABLE "CommandLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "remoteSessionId" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "CommandStatus" NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "CommandLog_pkey" PRIMARY KEY ("id")
);

-- Create AuditEvent table
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "remoteSessionId" TEXT,
    "actorUserId" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- Create StreamStateSnapshot table
CREATE TABLE "StreamStateSnapshot" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "streamerId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreamStateSnapshot_pkey" PRIMARY KEY ("id")
);

-- Create AgentConnection table
CREATE TABLE "AgentConnection" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "streamerId" TEXT NOT NULL,
    "agentVersion" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "heartbeatAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentConnection_pkey" PRIMARY KEY ("id")
);

-- Create RefreshToken table
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "StreamerProfile_userId_key" ON "StreamerProfile"("userId");
CREATE UNIQUE INDEX "OperatorPermission_streamerId_operatorId_key" ON "OperatorPermission"("streamerId", "operatorId");
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- Add foreign keys
ALTER TABLE "StreamerProfile" ADD CONSTRAINT "StreamerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperatorPermission" ADD CONSTRAINT "OperatorPermission_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperatorPermission" ADD CONSTRAINT "OperatorPermission_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RemoteSession" ADD CONSTRAINT "RemoteSession_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RemoteSession" ADD CONSTRAINT "RemoteSession_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommandLog" ADD CONSTRAINT "CommandLog_remoteSessionId_fkey" FOREIGN KEY ("remoteSessionId") REFERENCES "RemoteSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommandLog" ADD CONSTRAINT "CommandLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_remoteSessionId_fkey" FOREIGN KEY ("remoteSessionId") REFERENCES "RemoteSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StreamStateSnapshot" ADD CONSTRAINT "StreamStateSnapshot_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "StreamerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentConnection" ADD CONSTRAINT "AgentConnection_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "StreamerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
