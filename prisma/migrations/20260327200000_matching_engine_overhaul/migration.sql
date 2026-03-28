-- Add audience_gender and creator_size to content_creators
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "audience_gender" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "creator_size" TEXT;

-- Remove target_age_ranges from campaigns (replaced by existing min_audience_age / max_audience_age)
ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "target_age_ranges";
