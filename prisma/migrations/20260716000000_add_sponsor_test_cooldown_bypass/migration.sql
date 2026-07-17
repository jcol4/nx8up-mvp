-- Additive: per-sponsor flag to bypass the reputation cooldown for testing.
ALTER TABLE "sponsors" ADD COLUMN IF NOT EXISTS "test_cooldown_bypass" BOOLEAN NOT NULL DEFAULT false;
