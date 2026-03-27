ALTER TABLE content_creators ADD COLUMN IF NOT EXISTS creator_types TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE content_creators ADD COLUMN IF NOT EXISTS content_style TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE content_creators ADD COLUMN IF NOT EXISTS audience_interests TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE content_creators ADD COLUMN IF NOT EXISTS preferred_campaign_types TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE content_creators ADD COLUMN IF NOT EXISTS preferred_product_types TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE content_creators ADD COLUMN IF NOT EXISTS primary_platform TEXT;
ALTER TABLE content_creators ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE content_creators ADD COLUMN IF NOT EXISTS max_campaigns_per_month INT;
