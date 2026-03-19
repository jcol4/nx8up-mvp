-- AlterTable
ALTER TABLE "content_creators" ADD COLUMN     "twitch_access_token" TEXT,
ADD COLUMN     "twitch_refresh_token" TEXT,
ADD COLUMN     "twitch_subscriber_count" INTEGER,
ADD COLUMN     "twitch_token_expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "youtube_access_token" TEXT,
ADD COLUMN     "youtube_refresh_token" TEXT,
ADD COLUMN     "youtube_token_expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "youtube_watch_time_hours" INTEGER;

-- CreateIndex
CREATE INDEX "content_creators_youtube_channel_id_idx" ON "content_creators"("youtube_channel_id");

-- CreateIndex
CREATE INDEX "content_creators_youtube_subscribers_idx" ON "content_creators"("youtube_subscribers");
