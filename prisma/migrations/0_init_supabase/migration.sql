-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "content_creators" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clerk_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "age" INTEGER,
    "location" TEXT,
    "language" TEXT[],
    "platform" TEXT[],
    "average_viewers" INTEGER,
    "subs_followers" INTEGER,
    "engagement_rate" DECIMAL(5,2),
    "content_type" TEXT[],
    "game_category" TEXT[],
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clerk_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company_name" TEXT,
    "location" TEXT,
    "language" TEXT[],
    "budget_min" INTEGER,
    "budget_max" INTEGER,
    "min_avg_viewers" INTEGER,
    "min_subs_followers" INTEGER,
    "min_engagement_rate" DECIMAL(5,2),
    "platform" TEXT[],
    "content_type" TEXT[],
    "game_category" TEXT[],
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_creators_clerk_user_id_key" ON "content_creators"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_creators_email_key" ON "content_creators"("email");

-- CreateIndex
CREATE INDEX "content_creators_average_viewers_idx" ON "content_creators"("average_viewers");

-- CreateIndex
CREATE INDEX "content_creators_content_type_idx" ON "content_creators" USING GIN ("content_type");

-- CreateIndex
CREATE INDEX "content_creators_engagement_rate_idx" ON "content_creators"("engagement_rate");

-- CreateIndex
CREATE INDEX "content_creators_game_category_idx" ON "content_creators" USING GIN ("game_category");

-- CreateIndex
CREATE INDEX "content_creators_language_idx" ON "content_creators" USING GIN ("language");

-- CreateIndex
CREATE INDEX "content_creators_platform_idx" ON "content_creators" USING GIN ("platform");

-- CreateIndex
CREATE INDEX "content_creators_subs_followers_idx" ON "content_creators"("subs_followers");

-- CreateIndex
CREATE UNIQUE INDEX "sponsors_clerk_user_id_key" ON "sponsors"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sponsors_email_key" ON "sponsors"("email");

-- CreateIndex
CREATE INDEX "sponsors_budget_max_idx" ON "sponsors"("budget_max");

-- CreateIndex
CREATE INDEX "sponsors_budget_min_idx" ON "sponsors"("budget_min");

-- CreateIndex
CREATE INDEX "sponsors_content_type_idx" ON "sponsors" USING GIN ("content_type");

-- CreateIndex
CREATE INDEX "sponsors_game_category_idx" ON "sponsors" USING GIN ("game_category");

-- CreateIndex
CREATE INDEX "sponsors_language_idx" ON "sponsors" USING GIN ("language");

-- CreateIndex
CREATE INDEX "sponsors_min_avg_viewers_idx" ON "sponsors"("min_avg_viewers");

-- CreateIndex
CREATE INDEX "sponsors_min_engagement_rate_idx" ON "sponsors"("min_engagement_rate");

-- CreateIndex
CREATE INDEX "sponsors_min_subs_followers_idx" ON "sponsors"("min_subs_followers");

-- CreateIndex
CREATE INDEX "sponsors_platform_idx" ON "sponsors" USING GIN ("platform");

