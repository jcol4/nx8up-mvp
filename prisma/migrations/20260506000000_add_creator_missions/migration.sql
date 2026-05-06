-- CreateTable
CREATE TABLE "creator_missions" (
    "id" TEXT NOT NULL,
    "creator_id" UUID NOT NULL,
    "mission_id" TEXT NOT NULL,
    "mission_type" TEXT NOT NULL,
    "week_start" TIMESTAMPTZ(6),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_missions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creator_missions_creator_id_week_start_idx" ON "creator_missions"("creator_id", "week_start");

-- CreateIndex
CREATE INDEX "creator_missions_creator_id_completed_idx" ON "creator_missions"("creator_id", "completed");

-- CreateIndex
CREATE UNIQUE INDEX "creator_missions_creator_id_mission_id_week_start_key" ON "creator_missions"("creator_id", "mission_id", "week_start");

-- AddForeignKey
ALTER TABLE "creator_missions" ADD CONSTRAINT "creator_missions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "content_creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
