-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('CONTACT', 'EVENT_PROPOSAL', 'MEMBERSHIP');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NEW', 'REVIEWED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "type" "SubmissionType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT,
    "payload" JSONB,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Submission_type_status_createdAt_idx" ON "Submission"("type", "status", "createdAt");
