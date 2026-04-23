-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stripe_dispute_id" TEXT NOT NULL,
    "campaign_id" UUID,
    "stripe_charge_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "evidence_json" JSONB,
    "executive_summary" TEXT,
    "admin_notes" TEXT,
    "stripe_submission_status" TEXT,
    "due_by" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dispute_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "dispute_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disputes_stripe_dispute_id_key" ON "disputes"("stripe_dispute_id");

-- CreateIndex
CREATE INDEX "disputes_campaign_id_idx" ON "disputes"("campaign_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "dispute_events_dispute_id_idx" ON "dispute_events"("dispute_id");

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_events" ADD CONSTRAINT "dispute_events_dispute_id_fkey"
    FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
