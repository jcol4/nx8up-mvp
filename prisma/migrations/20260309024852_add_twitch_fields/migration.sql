/*
  Warnings:

  - A unique constraint covering the columns `[twitch_id]` on the table `content_creators` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "content_creators" ADD COLUMN     "twitch_broadcaster_type" TEXT,
ADD COLUMN     "twitch_created_at" TIMESTAMPTZ(6),
ADD COLUMN     "twitch_description" TEXT,
ADD COLUMN     "twitch_id" TEXT,
ADD COLUMN     "twitch_profile_image" TEXT,
ADD COLUMN     "twitch_synced_at" TIMESTAMPTZ(6),
ADD COLUMN     "twitch_username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "content_creators_twitch_id_key" ON "content_creators"("twitch_id");
