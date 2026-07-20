-- Additive: creator affiliate/referral program.
ALTER TABLE "content_creators" ADD COLUMN IF NOT EXISTS "referral_code" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "content_creators_referral_code_key" ON "content_creators"("referral_code");

-- CreateTable
CREATE TABLE IF NOT EXISTS "creator_referrals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referrer_id" UUID NOT NULL,
    "referred_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reward_granted_at" TIMESTAMPTZ(6),

    CONSTRAINT "creator_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "creator_referrals_referred_id_key" ON "creator_referrals"("referred_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "creator_referrals_referrer_id_idx" ON "creator_referrals"("referrer_id");

-- AddForeignKey
ALTER TABLE "creator_referrals" ADD CONSTRAINT "creator_referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "content_creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_referrals" ADD CONSTRAINT "creator_referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "content_creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
