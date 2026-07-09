-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "googlePlaceId" TEXT;
ALTER TABLE "Venue" ADD COLUMN "placeCache" JSONB;
ALTER TABLE "Venue" ADD COLUMN "placeCachedAt" TIMESTAMP(3);
