-- AlterTable
ALTER TABLE "campaign_applications" ADD COLUMN "tracking_short_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "campaign_applications_tracking_short_code_key" ON "campaign_applications"("tracking_short_code");

-- CreateTable
CREATE TABLE "link_clicks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "clicked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "referrer" TEXT,

    CONSTRAINT "link_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "link_clicks_application_id_idx" ON "link_clicks"("application_id");

-- CreateIndex
CREATE INDEX "link_clicks_clicked_at_idx" ON "link_clicks"("clicked_at");

-- AddForeignKey
ALTER TABLE "link_clicks" ADD CONSTRAINT "link_clicks_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "campaign_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
