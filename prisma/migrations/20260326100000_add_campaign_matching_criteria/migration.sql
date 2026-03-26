ALTER TABLE "campaigns" ADD COLUMN "min_audience_age" INTEGER;
ALTER TABLE "campaigns" ADD COLUMN "max_audience_age" INTEGER;
ALTER TABLE "campaigns" ADD COLUMN "required_audience_locations" TEXT[] NOT NULL DEFAULT '{}';
