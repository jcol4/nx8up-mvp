/*
  Warnings:

  - You are about to drop the `mission_applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `missions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "mission_applications" DROP CONSTRAINT "mission_applications_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "mission_applications" DROP CONSTRAINT "mission_applications_mission_id_fkey";

-- DropForeignKey
ALTER TABLE "missions" DROP CONSTRAINT "missions_sponsor_id_fkey";

-- DropTable
DROP TABLE "mission_applications";

-- DropTable
DROP TABLE "missions";

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sponsor_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "budget" INTEGER,
    "platform" TEXT[],
    "content_type" TEXT[],
    "game_category" TEXT[],
    "min_avg_viewers" INTEGER,
    "min_subs_followers" INTEGER,
    "min_engagement_rate" DECIMAL(5,2),
    "creative_package" TEXT[],
    "deadline" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "submitted_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_sponsor_id_idx" ON "campaigns"("sponsor_id");

-- CreateIndex
CREATE INDEX "campaigns_platform_idx" ON "campaigns" USING GIN ("platform");

-- CreateIndex
CREATE INDEX "campaigns_content_type_idx" ON "campaigns" USING GIN ("content_type");

-- CreateIndex
CREATE INDEX "campaigns_game_category_idx" ON "campaigns" USING GIN ("game_category");

-- CreateIndex
CREATE INDEX "campaigns_deadline_idx" ON "campaigns"("deadline");

-- CreateIndex
CREATE INDEX "campaign_applications_campaign_id_idx" ON "campaign_applications"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_applications_creator_id_idx" ON "campaign_applications"("creator_id");

-- CreateIndex
CREATE INDEX "campaign_applications_status_idx" ON "campaign_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_applications_campaign_id_creator_id_key" ON "campaign_applications"("campaign_id", "creator_id");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "sponsors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "content_creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
