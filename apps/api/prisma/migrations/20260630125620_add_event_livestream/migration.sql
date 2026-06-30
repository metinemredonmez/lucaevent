-- CreateEnum
CREATE TYPE "LiveStatus" AS ENUM ('OFFLINE', 'LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "StreamAccess" AS ENUM ('PUBLIC', 'MEMBERS', 'PAID');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "liveStartedAt" TIMESTAMP(3),
ADD COLUMN     "liveStatus" "LiveStatus" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "streamAccess" "StreamAccess" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "streamPriceMinor" INTEGER,
ADD COLUMN     "streamUrl" TEXT;
