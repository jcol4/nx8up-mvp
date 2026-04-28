-- Add Steam profile fields to content_creators.
-- These columns were added to Supabase via db push from the testing branch
-- and are being formally recorded here.

ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "steam_id" TEXT;
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "steam_username" TEXT;
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "steam_avatar_url" TEXT;
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "steam_profile_url" TEXT;
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "steam_profile_visibility" INTEGER;
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "steam_top_games" JSONB;
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "steam_recent_games" JSONB;
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "steam_synced_at" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX IF NOT EXISTS "content_creators_steam_id_key" ON "content_creators"("steam_id");
