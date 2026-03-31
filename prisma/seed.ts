/**
 * Test seed — injects fake viewership stats for a creator account.
 *
 * Set TEST_SEED_USER_ID in your .env.local to your Clerk user ID.
 * Run with:  npm run seed
 */

import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

dotenv.config({ path: '.env.local' })
dotenv.config()

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ─── Edit these to whatever values you want to test with ────────────────────

const STATS = {
  // Twitch
  subs_followers:          87_400,
  twitch_subscriber_count: 1_250,
  average_vod_views:       3_800,
  engagement_rate:         4.72,

  // YouTube
  youtube_subscribers:     248_000,
  youtube_avg_views:       41_500,
  youtube_watch_time_hours: 19_200,
  youtube_member_count:    318,
  youtube_top_categories:  ['Gaming', 'Entertainment', 'Comedy'],

  // Audience demographics
  audience_age_min:        18,
  audience_age_max:        34,
  audience_locations:      ['United States', 'United Kingdom', 'Canada'],
}

// ────────────────────────────────────────────────────────────────────────────

async function main() {
  const userId = process.env.TEST_SEED_USER_ID
  if (!userId) {
    console.error('❌  Set TEST_SEED_USER_ID in .env.local to your Clerk user ID.')
    process.exit(1)
  }

  const updated = await prisma.content_creators.updateMany({
    where: { clerk_user_id: userId },
    data: STATS,
  })

  if (updated.count === 0) {
    console.error('❌  No creator found with that Clerk user ID. Have you completed onboarding?')
    process.exit(1)
  }

  console.log('✅  Test stats seeded.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
