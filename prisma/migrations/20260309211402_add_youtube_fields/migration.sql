/*
  Warnings:

  - You are about to drop the column `most_played_games` on the `content_creators` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[youtube_channel_id]` on the table `content_creators` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "content_creators" DROP COLUMN "most_played_games",
ADD COLUMN     "youtube_avg_views" INTEGER,
ADD COLUMN     "youtube_channel_id" TEXT,
ADD COLUMN     "youtube_channel_name" TEXT,
ADD COLUMN     "youtube_handle" TEXT,
ADD COLUMN     "youtube_subscribers" INTEGER,
ADD COLUMN     "youtube_synced_at" TIMESTAMPTZ(6),
ADD COLUMN     "youtube_top_categories" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "content_creators_youtube_channel_id_key" ON "content_creators"("youtube_channel_id");
