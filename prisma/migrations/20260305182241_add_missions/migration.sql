-- CreateTable
CREATE TABLE "missions" (
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

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mission_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "submitted_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "missions_status_idx" ON "missions"("status");

-- CreateIndex
CREATE INDEX "missions_sponsor_id_idx" ON "missions"("sponsor_id");

-- CreateIndex
CREATE INDEX "missions_platform_idx" ON "missions" USING GIN ("platform");

-- CreateIndex
CREATE INDEX "missions_content_type_idx" ON "missions" USING GIN ("content_type");

-- CreateIndex
CREATE INDEX "missions_game_category_idx" ON "missions" USING GIN ("game_category");

-- CreateIndex
CREATE INDEX "missions_deadline_idx" ON "missions"("deadline");

-- CreateIndex
CREATE INDEX "mission_applications_mission_id_idx" ON "mission_applications"("mission_id");

-- CreateIndex
CREATE INDEX "mission_applications_creator_id_idx" ON "mission_applications"("creator_id");

-- CreateIndex
CREATE INDEX "mission_applications_status_idx" ON "mission_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mission_applications_mission_id_creator_id_key" ON "mission_applications"("mission_id", "creator_id");

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "sponsors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_applications" ADD CONSTRAINT "mission_applications_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_applications" ADD CONSTRAINT "mission_applications_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "content_creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
