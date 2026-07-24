-- Additive: support multiple screenshot proof URLs per deal submission.
ALTER TABLE "deal_submissions" ADD COLUMN IF NOT EXISTS "screenshot_urls" TEXT[] NOT NULL DEFAULT '{}';
UPDATE "deal_submissions" SET "screenshot_urls" = ARRAY["screenshot_url"] WHERE "screenshot_url" IS NOT NULL;
ALTER TABLE "deal_submissions" DROP COLUMN IF EXISTS "screenshot_url";
