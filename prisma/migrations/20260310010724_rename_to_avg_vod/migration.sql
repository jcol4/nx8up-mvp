/*
  Warnings:

  - You are about to drop the column `average_viewers` on the `content_creators` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "content_creators_average_viewers_idx";

-- AlterTable
ALTER TABLE "content_creators" DROP COLUMN "average_viewers",
ADD COLUMN     "average_vod_views" INTEGER;

-- CreateIndex
CREATE INDEX "content_creators_average_vod_views_idx" ON "content_creators"("average_vod_views");
