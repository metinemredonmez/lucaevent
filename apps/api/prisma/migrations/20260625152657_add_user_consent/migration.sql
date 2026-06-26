-- AlterTable
ALTER TABLE "User" ADD COLUMN     "consentVersion" TEXT,
ADD COLUMN     "kvkkConsentAt" TIMESTAMP(3),
ADD COLUMN     "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);

