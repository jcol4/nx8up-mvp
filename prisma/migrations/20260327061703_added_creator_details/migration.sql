-- AlterTable
-- Note: target_age_ranges is added in a later migration; the DO block guards against ordering issues
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'target_age_ranges') THEN
    ALTER TABLE "campaigns" ALTER COLUMN "target_age_ranges" DROP DEFAULT;
  END IF;
END $$;
ALTER TABLE "campaigns"
ALTER COLUMN "target_genders" DROP DEFAULT,
ALTER COLUMN "target_interests" DROP DEFAULT,
ALTER COLUMN "creator_types" DROP DEFAULT,
ALTER COLUMN "creator_sizes" DROP DEFAULT,
ALTER COLUMN "video_includes" DROP DEFAULT;

-- AlterTable
ALTER TABLE "content_creators" ALTER COLUMN "creator_types" DROP DEFAULT,
ALTER COLUMN "content_style" DROP DEFAULT,
ALTER COLUMN "audience_interests" DROP DEFAULT,
ALTER COLUMN "preferred_campaign_types" DROP DEFAULT,
ALTER COLUMN "preferred_product_types" DROP DEFAULT;
