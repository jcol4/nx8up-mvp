-- Add new campaign fields
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS campaign_code TEXT,
  ADD COLUMN IF NOT EXISTS brand_name TEXT,
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS campaign_type TEXT,
  ADD COLUMN IF NOT EXISTS payment_model TEXT,
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- Migrate deadline → end_date
UPDATE campaigns SET end_date = deadline WHERE deadline IS NOT NULL AND end_date IS NULL;

-- Generate campaign codes for existing rows
UPDATE campaigns
SET campaign_code = 'NX-' || upper(substring(md5(id::text), 1, 8))
WHERE campaign_code IS NULL;

-- Migrate status: active → live
UPDATE campaigns SET status = 'live' WHERE status = 'active';

-- Drop old deadline column
ALTER TABLE campaigns DROP COLUMN IF EXISTS deadline;

-- Add unique constraint on campaign_code
ALTER TABLE campaigns ADD CONSTRAINT campaigns_campaign_code_key UNIQUE (campaign_code);
