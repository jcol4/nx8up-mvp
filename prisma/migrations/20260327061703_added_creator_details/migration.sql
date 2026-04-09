-- AlterTable
-- All these columns are added in a later migration (add_campaign_wizard_fields); guard each one
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'target_age_ranges') THEN
    ALTER TABLE "campaigns" ALTER COLUMN "target_age_ranges" DROP DEFAULT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'target_genders') THEN
    ALTER TABLE "campaigns" ALTER COLUMN "target_genders" DROP DEFAULT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'target_interests') THEN
    ALTER TABLE "campaigns" ALTER COLUMN "target_interests" DROP DEFAULT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'creator_types') THEN
    ALTER TABLE "campaigns" ALTER COLUMN "creator_types" DROP DEFAULT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'creator_sizes') THEN
    ALTER TABLE "campaigns" ALTER COLUMN "creator_sizes" DROP DEFAULT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'video_includes') THEN
    ALTER TABLE "campaigns" ALTER COLUMN "video_includes" DROP DEFAULT;
  END IF;
END $$;

-- AlterTable
-- These columns are added in a later migration (add_creator_profile_wizard_fields); guard each one
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'creator_types') THEN
    ALTER TABLE "content_creators" ALTER COLUMN "creator_types" DROP DEFAULT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'content_style') THEN
    ALTER TABLE "content_creators" ALTER COLUMN "content_style" DROP DEFAULT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'audience_interests') THEN
    ALTER TABLE "content_creators" ALTER COLUMN "audience_interests" DROP DEFAULT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'preferred_campaign_types') THEN
    ALTER TABLE "content_creators" ALTER COLUMN "preferred_campaign_types" DROP DEFAULT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_creators' AND column_name = 'preferred_product_types') THEN
    ALTER TABLE "content_creators" ALTER COLUMN "preferred_product_types" DROP DEFAULT;
  END IF;
END $$;
