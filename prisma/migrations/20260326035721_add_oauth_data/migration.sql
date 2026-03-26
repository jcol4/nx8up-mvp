-- AlterTable
ALTER TABLE "campaign_applications" ALTER COLUMN "app_audience_locations" DROP DEFAULT;

-- AlterTable
ALTER TABLE "content_creators" ALTER COLUMN "audience_locations" DROP DEFAULT;
