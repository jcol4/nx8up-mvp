-- Additive: regional (macro-region) audience targeting, layered on top of country-level targeting.
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "audience_regions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "required_audience_regions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "campaign_applications" ADD COLUMN IF NOT EXISTS "app_audience_regions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "campaign_applications" ADD COLUMN IF NOT EXISTS "app_required_regions" TEXT[] DEFAULT ARRAY[]::TEXT[];
