# nx8up

A creator-sponsor matching and campaign management platform that connects content creators (streamers, YouTubers, Steam gamers) with brands seeking influencer marketing partnerships. Creators discover and apply for sponsored campaigns, submit proof of work, and receive payouts — sponsors launch campaigns, review applicants, and track performance.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Third-Party Services & API Keys](#third-party-services--api-keys)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Site Flow](#site-flow)
  - [Creator Flow](#creator-flow)
  - [Sponsor Flow](#sponsor-flow)
  - [Admin Flow](#admin-flow)
- [Payments & Payouts](#payments--payouts)
- [Cron Jobs](#cron-jobs)
- [Deployment](#deployment)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL (hosted on Supabase) |
| ORM | Prisma 7 with Neon serverless adapter |
| Authentication | Clerk |
| Payments | Stripe (Connect for creator payouts) |
| Email | Resend |
| Deployment | Vercel |

---

## Third-Party Services & API Keys

You will need accounts and credentials for the following services before running the app.

### Clerk — Authentication
Handles user signup, login, and role metadata. Also fires webhooks on user events.
- Create a project at [clerk.com](https://clerk.com)
- Add a webhook endpoint pointing to `<YOUR_URL>/api/webhooks/clerk` and note the signing secret
- Required keys: `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`

### Stripe — Payments & Payouts
Sponsors pay via card or ACH bank transfer. Creators receive payouts via Stripe Connect.
- Create an account at [stripe.com](https://stripe.com)
- Enable Stripe Connect (Standard accounts) in your dashboard
- Set up a webhook endpoint pointing to `<YOUR_URL>/api/stripe/webhook` with these events:
  - `payment_intent.processing`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.succeeded`
  - `account.updated`
  - `transfer.created`
  - `charge.dispute.created`
  - `payout.failed`
- Required keys: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

### Supabase — Database
PostgreSQL hosting with connection pooling.
- Create a project at [supabase.com](https://supabase.com)
- Required keys: `DATABASE_URL` (pooled connection string), `DIRECT_URL` (direct connection, for migrations)

### YouTube Data API v3 — Creator Stats
Fetches public channel stats (subscribers, video views, categories).
- Enable YouTube Data API v3 in [Google Cloud Console](https://console.cloud.google.com)
- Create OAuth 2.0 credentials for the YouTube OAuth flow
- Set the OAuth redirect URI to `<YOUR_URL>/api/auth/youtube/callback`
- Required keys: `YOUTUBE_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`

### Twitch — Creator Stats & OAuth
Fetches channel followers, VOD stats, and top game categories.
- Register an application at [dev.twitch.tv](https://dev.twitch.tv)
- Set the OAuth redirect URI to `<YOUR_URL>/api/auth/twitch/callback`
- Required keys: `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_REDIRECT_URI`

### Steam Web API — Creator Stats
Fetches Steam profile data, top games, and recent activity for creator profiles.
- Get an API key at [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)
- Steam authentication uses OpenID 2.0 — no separate OAuth app registration required; the callback URL is derived from `NEXT_PUBLIC_APP_URL`
- Required keys: `STEAM_API_KEY`

### Resend — Transactional Email
Delivers notification emails to users.
- Create an account at [resend.com](https://resend.com) and verify your sending domain
- Required keys: `RESEND_API_KEY`

---

## Environment Variables

Create a `.env.local` file in the project root. The `.env` file already contains the database URLs; all secrets go in `.env.local`.

```bash
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://..."         # Supabase pooled connection string
DIRECT_URL="postgresql://..."           # Supabase direct connection (used for migrations)

# ── Clerk ─────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."        # From Clerk webhook endpoint settings
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# ── Stripe ────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_PLATFORM_FEE_PERCENT=15     # Platform takes 15% of each campaign budget

# ── YouTube / Google OAuth ────────────────────────────────────────────────────
YOUTUBE_API_KEY="AIza..."
GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
YOUTUBE_REDIRECT_URI="http://localhost:3000/api/auth/youtube/callback"

# ── Twitch ────────────────────────────────────────────────────────────────────
TWITCH_CLIENT_ID="..."
TWITCH_CLIENT_SECRET="..."
TWITCH_REDIRECT_URI="http://localhost:3000/api/auth/twitch/callback"

# ── Steam ─────────────────────────────────────────────────────────────────────
STEAM_API_KEY="..."                     # Steam Web API key (no redirect URI needed)

# ── Resend ────────────────────────────────────────────────────────────────────
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="notifications@yourdomain.com"  # Optional; defaults to notifications@nx8up.com

# ── Security ──────────────────────────────────────────────────────────────────
# AES-256-GCM key for encrypting stored OAuth tokens. Generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
TOKEN_ENCRYPTION_KEY="base64-encoded-32-byte-key"

# Bearer token for authenticating Vercel cron job requests
CRON_SECRET="..."

# ── App ───────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Note:** For production, replace all `localhost` redirect URIs with your deployed URL and update them in the respective provider dashboards.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Push the database schema
npx prisma db push

# (Optional) Seed test data
# Requires TEST_SEED_USER_ID set to a valid Clerk user ID
TEST_SEED_USER_ID="user_..." npm run seed

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed test creator data (requires `TEST_SEED_USER_ID`) |
| `npm run test` | Run test suite (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

### Generating the Token Encryption Key

OAuth refresh tokens (Twitch, YouTube) are encrypted at rest with AES-256-GCM. Generate a key before running the app:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste the output as `TOKEN_ENCRYPTION_KEY` in `.env.local`.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Root — redirects to dashboard by role
│   ├── onboarding/                     # Role selection & age verification
│   ├── sign-in/ & sign-up/             # Clerk auth pages
│   ├── forgot-password/                # Password reset flow
│   ├── creator/                        # Creator dashboard
│   │   ├── campaigns/                  # Browse & apply for campaigns
│   │   ├── campaigns/pending/          # Pending applications
│   │   ├── deal-room/                  # Manage submissions & proof of work
│   │   ├── academy/                    # Educational content & XP system
│   │   ├── steam-lookup/               # Steam profile search
│   │   └── profile/ & settings/
│   ├── sponsor/                        # Sponsor dashboard
│   │   ├── campaigns/                  # Create & manage campaigns
│   │   ├── campaigns/[id]/applications # Review creator applications
│   │   ├── creators/                   # Discover & search creators
│   │   ├── deal-room/                  # Review creator submissions
│   │   ├── steam-lookup/               # Steam profile search
│   │   └── payouts/ & profile/ & settings/
│   ├── admin/                          # Admin dashboard
│   │   ├── users/                      # Creator & sponsor user management
│   │   ├── campaigns/                  # Campaign oversight
│   │   ├── applications/               # Application oversight
│   │   ├── verification-queue/         # Age restriction requests
│   │   ├── disputes/                   # Stripe dispute management
│   │   ├── refund-requests/            # Sponsor refund request queue
│   │   ├── opt-outs/                   # Creator campaign opt-out queue
│   │   ├── sponsor-profile-changes/    # Sponsor profile change approvals
│   │   ├── sanctioned-launches/        # Campaign sanction queue
│   │   ├── surveys/                    # Survey creation & results
│   │   ├── steam-lookup/               # Steam profile lookup tool
│   │   └── academy/ & reports/ & settings/
│   ├── api/
│   │   ├── auth/twitch/                # Twitch OAuth callback
│   │   ├── auth/youtube/               # YouTube OAuth callback
│   │   ├── auth/steam/                 # Steam OpenID 2.0 initiation & callback
│   │   ├── steam/lookup/               # Steam profile lookup endpoint
│   │   ├── stripe/                     # Payment intents, webhooks, payouts, refunds
│   │   ├── stripe/connect/             # Stripe Connect onboarding & return
│   │   ├── notifications/              # Notification CRUD & preferences
│   │   ├── sponsor/payouts/            # Payout data & CSV export
│   │   ├── survey/ & admin/surveys/    # Survey API (public + admin)
│   │   ├── admin/refund-requests/      # Refund request verdicts
│   │   ├── admin/sanctioned-launches/  # Sanctioned launch verdicts
│   │   ├── webhooks/clerk/             # Clerk user event webhooks
│   │   └── cron/                       # Scheduled job endpoints
│   └── r/                              # Tracking redirect handler (affiliate links)
├── components/                         # React components by role/domain
│   ├── creator/
│   ├── sponsor/
│   ├── steam/
│   ├── dashboard/
│   ├── layout/
│   ├── nx-shell/
│   ├── shared/
│   └── ui/
├── lib/                                # Business logic & service clients
│   ├── prisma.ts                       # Prisma client singleton (Neon adapter)
│   ├── stripe.ts                       # Stripe client singleton
│   ├── email.ts                        # Resend email delivery
│   ├── notifications.ts                # Notification creation with deduplication
│   ├── twitch.ts                       # Twitch Helix API utilities
│   ├── youtube.ts                      # YouTube Data API v3 utilities
│   ├── steam.ts                        # Steam Web API utilities
│   ├── token-encryption.ts             # AES-256-GCM token encryption
│   ├── matching.ts                     # Creator–campaign matching engine
│   ├── ctr.ts                          # Click-through rate calculation
│   ├── reputation.ts                   # Creator & sponsor reputation scoring
│   ├── missions.ts                     # Mission definitions
│   ├── mission-assignment.ts           # Weekly mission assignment logic
│   ├── mission-resolver.ts             # Mission completion detection
│   ├── creator-xp.ts                   # XP and level calculation
│   ├── disputes.ts                     # Stripe dispute evidence handling
│   ├── late-penalties.ts               # Late submission penalty logic
│   └── academy-lessons.ts              # Academy content definitions
└── hooks/
prisma/
├── schema.prisma                       # Database schema
└── seed.ts                             # Test data seeder
vercel.json                             # Deployment & cron configuration
```

---

## Database Schema

### Models

| Model | Description |
|---|---|
| `content_creators` | Creator profiles — platform stats, Stripe Connect status, Steam/Twitch/YouTube data |
| `sponsors` | Sponsor/brand profiles — company info, targeting criteria, Stripe customer ID |
| `admins` | Admin user records |
| `campaigns` | Marketing campaigns — budget, targeting criteria, status, payment intent |
| `campaign_applications` | Creator applications to campaigns — pending / accepted / rejected |
| `deal_submissions` | Proof of work — proof URLs, CTR, payout status, Stripe transfer ID |
| `link_clicks` | Affiliate link click tracking for CTR calculation |
| `sponsor_age_restriction_requests` | Requests to enable 18+ campaign targeting (requires admin approval) |
| `sanctioned_launch_requests` | Requests for admin-sanctioned campaign launches |
| `refund_requests` | Sponsor refund requests with admin verdict queue |
| `creator_opt_outs` | Creator requests to opt out of an accepted campaign |
| `creator_missions` | Weekly gamification missions assigned to creators |
| `disputes` | Stripe chargeback/dispute tracking with evidence management |
| `dispute_events` | Event log for dispute lifecycle changes |
| `Survey` / `SurveyQuestion` / `SurveyResponse` | Admin-created surveys distributed to creators and/or sponsors |
| `Notification` | In-app notifications with deduplication |
| `NotificationPreference` | Per-user notification opt-in/out preferences |

### Campaign Status Lifecycle

```
draft → pending_payment → payment_in_progress → live → completed
```

### Application Status Lifecycle

```
pending → accepted | rejected
```

### Submission Status Lifecycle

```
pending → approved | needs_revision
```

### Payout Status Lifecycle

```
pending → paid | failed
```

---

## Site Flow

### Creator Flow

1. **Sign up & Onboarding** — Register via Clerk, verify age (18+), select Creator role.
2. **Profile Setup** — Link Twitch, YouTube, and/or Steam accounts. Twitch and YouTube use OAuth; Steam uses OpenID 2.0. Platform stats (subscribers, avg views, top games) are fetched and stored. OAuth tokens for Twitch and YouTube are AES-256-GCM encrypted before storage.
3. **Command Center** — Dashboard showing active missions, XP progress, reputation tier, and campaign activity.
4. **Campaign Discovery** — Browse live campaigns surfaced by the matching engine. Matching scores campaigns on platform overlap, content type, audience size, and engagement rate with hard blocks for extreme stat mismatches.
5. **Application** — Apply to a campaign with an optional message. Application is created with status `pending`.
6. **Acceptance & Submission** — Once accepted, submit proof of work (YouTube/Twitch URLs). Audience clicks are tracked via `/r/<code>` redirect links; a daily cron fetches current view counts and recalculates CTR.
7. **Payout** — Creator onboards with Stripe Connect. On submission approval, a Stripe Connect transfer is initiated. The `transfer.created` webhook marks the submission `paid` and sends a notification.
8. **Missions & XP** — Weekly missions are assigned each Monday. Completing missions earns XP that contributes to the creator's level and reputation tier. Late submissions incur reputation penalties.

### Sponsor Flow

1. **Sign up & Onboarding** — Register via Clerk, verify age (18+), select Sponsor role.
2. **Campaign Creation** — Define budget, target platforms, creator criteria (min subscribers, min engagement rate, audience demographics, Steam game categories), and campaign deliverables. Campaign saved as `draft`.
3. **Age Restriction (optional)** — Request 18+ creator targeting via the admin verification queue.
4. **Campaign Launch** — Pay via card or ACH bank transfer through Stripe. `payment_intent.succeeded` webhook advances campaign to `live` and makes it visible to matching creators. Campaigns with certain criteria require admin sanction before going live.
5. **Application Review** — Accept or reject creator applications. Notifications are sent to creators automatically.
6. **Submission Review** — Review deal submissions with proof URLs and CTR data. Approve or request revisions.
7. **Payouts** — Approved submissions trigger Stripe Connect transfers to creators. Export payout ledger as CSV from the Payouts page.
8. **Refunds** — Request a refund for an unfulfilled campaign through the refund request queue (subject to admin review).

### Admin Flow

1. **Verification Queue** — Review and approve/reject sponsor age-restriction requests.
2. **Sanction Queue** — Review and approve/reject campaigns requiring admin sanction before launch.
3. **Refund Requests** — Review and rule on sponsor refund requests.
4. **Opt-Out Queue** — Review creator requests to opt out of accepted campaigns.
5. **Disputes** — Manage Stripe chargebacks: review dispute evidence, write executive summaries, and track submission status.
6. **Sponsor Profile Changes** — Review and approve changes to sponsor profiles that require verification.
7. **User Management** — View and manage creators, sponsors, and admins across the platform.
8. **Campaign Oversight** — Monitor all campaigns and application statuses.
9. **Surveys** — Create and distribute surveys to creators and/or sponsors; view aggregated results.
10. **Academy** — Create and manage educational content for creators.
11. **Reports** — Access platform-wide analytics and reporting.
12. **Steam Lookup** — Look up any Steam profile by username or URL for verification purposes.

---

## Payments & Payouts

The payment model is a two-step transfer:

1. **Sponsor → Platform:** Sponsor pays the full campaign budget via Stripe (card or ACH). The platform retains `NEXT_PUBLIC_PLATFORM_FEE_PERCENT` (default 15%).
2. **Platform → Creator:** After a submission is approved, the platform initiates a Stripe Connect transfer to the creator's connected account for their share of the budget.

### Stripe Webhook Events

The endpoint `/api/stripe/webhook` handles:

| Event | Action |
|---|---|
| `payment_intent.processing` | Advances campaign from `pending_payment` to `payment_in_progress` |
| `payment_intent.succeeded` | Advances campaign to `live`; notifies sponsor |
| `payment_intent.payment_failed` | Notifies sponsor of payment failure |
| `charge.succeeded` | Records charge ID on the campaign; sends confirmation email to sponsor |
| `account.updated` | Updates Stripe Connect onboarding status on creator profile |
| `transfer.created` | Marks deal submission payout as `paid`; notifies creator |
| `charge.dispute.created` | Creates a dispute record and notifies admin |
| `payout.failed` | Marks payout as `failed`; notifies creator and admin |

---

## Cron Jobs

Configured in `vercel.json` and executed by Vercel's cron scheduler. All endpoints require an `Authorization: Bearer <CRON_SECRET>` header, which Vercel sends automatically when `CRON_SECRET` is configured in project settings.

| Endpoint | Schedule | Purpose |
|---|---|---|
| `/api/cron/recalculate-ctr` | Daily at midnight UTC | Fetches live view counts from YouTube & Twitch APIs for all active deal submissions, then recalculates CTR as `(link_clicks / avg_video_views) * 100` |
| `/api/cron/late-penalties` | Daily at 2 AM UTC | Applies reputation penalties to creators with overdue deal submissions |
| `/api/cron/assign-missions` | Weekly on Mondays at midnight UTC | Assigns a fresh set of weekly missions to all active creators |

---

## Deployment

The app is deployed on **Vercel** with a **Supabase** PostgreSQL database.

### Vercel Setup

1. Import the repository in the Vercel dashboard.
2. Add all environment variables from the [Environment Variables](#environment-variables) section to the project settings.
3. Update all `localhost` redirect URIs to your production domain in the Clerk, Stripe, Twitch, and Google dashboards.
4. Add `CRON_SECRET` to Vercel environment variables — Vercel will automatically include it as a bearer token on cron requests.

### Database Migrations

```bash
# Apply pending migrations to production
npx prisma migrate deploy

# Or push schema directly (no migration history)
npx prisma db push
```

### WSL2 Development Note

`next.config.ts` includes `allowedDevOrigins` and `serverActions.allowedOrigins` entries for a WSL2 host IP. Update or remove these for non-WSL2 environments or move the IP to an environment variable for portability.
