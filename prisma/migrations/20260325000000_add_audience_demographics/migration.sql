-- Add audience demographics fields to content_creators
ALTER TABLE "content_creators" ADD COLUMN "audience_age_min" INTEGER;
ALTER TABLE "content_creators" ADD COLUMN "audience_age_max" INTEGER;
ALTER TABLE "content_creators" ADD COLUMN "audience_locations" TEXT[] NOT NULL DEFAULT '{}';

-- Add application-specific audience override fields to campaign_applications
ALTER TABLE "campaign_applications" ADD COLUMN "app_audience_age_min" INTEGER;
ALTER TABLE "campaign_applications" ADD COLUMN "app_audience_age_max" INTEGER;
ALTER TABLE "campaign_applications" ADD COLUMN "app_audience_locations" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "campaign_applications" ADD COLUMN "app_location" TEXT;
