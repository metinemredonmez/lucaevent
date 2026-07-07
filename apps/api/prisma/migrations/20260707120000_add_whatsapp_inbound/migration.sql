-- CreateEnum
CREATE TYPE "WaInboundStatus" AS ENUM ('NEW', 'PARSED', 'CONVERTED', 'IGNORED', 'FAILED');

-- CreateTable
CREATE TABLE "WhatsappInbound" (
    "id" TEXT NOT NULL,
    "waMessageId" TEXT NOT NULL,
    "groupName" TEXT,
    "sender" TEXT,
    "rawText" TEXT NOT NULL,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parsed" JSONB,
    "parseError" TEXT,
    "status" "WaInboundStatus" NOT NULL DEFAULT 'NEW',
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappInbound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappInbound_waMessageId_key" ON "WhatsappInbound"("waMessageId");

-- CreateIndex
CREATE INDEX "WhatsappInbound_status_createdAt_idx" ON "WhatsappInbound"("status", "createdAt");
