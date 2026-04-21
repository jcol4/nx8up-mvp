# nx8up

A creator-sponsor matching and campaign management platform that connects content creators (streamers, YouTubers) with brands seeking influencer marketing partnerships. Creators discover and apply for sponsored campaigns, submit proof of work, and receive payouts — sponsors launch campaigns, review applicants, and track performance.

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
Handles user signup, login, and role metadata.
- Create a project at [clerk.com](https://clerk.com)
- Required keys: `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### Stripe — Payments & Payouts
Sponsors pay via card or ACH bank transfer. Creators receive payouts via Stripe Connect.
- Create an account at [stripe.com](https://stripe.com)
- Enable Stripe Connect (Standard accounts) in your dashboard
- Set up a webhook endpoint pointing to `<YOUR_URL>/api/stripe/webhook` with these events:
  - `payment_intent.succeeded`
  - `charge.succeeded`
  - `transfer.created`
  - `transfer.failed`
- Required keys: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

### Supabase — Database
PostgreSQL hosting with connection pooling.
- Create a project at [supabase.com](https://supabase.com)
- Required keys: `DATABASE_URL` (pooled), `DIRECT_URL` (direct, for migrations)

### YouTube Data API v3 — Creator Stats
Fetches public channel stats (subscribers, video views, categories).
- Enable YouTube Data API v3 in [Google Cloud Console](https://console.cloud.google.com)
- Create OAuth 2.0 credentials for the YouTube OAuth flow
- Required keys: `YOUTUBE_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`

### Twitch — Creator Stats & OAuth
Fetches channel followers, VOD stats, and top game categories.
- Register an application at [dev.twitch.tv](https://dev.twitch.tv)
- Set the OAuth redirect URI to `<YOUR_URL>/api/auth/twitch/callback`
- Required keys: `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_REDIRECT_URI`

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
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# ── Stripe ────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PLATFORM_FEE_PERCENT=15                 # Platform takes 15% of each campaign budget

# ── YouTube / Google OAuth ────────────────────────────────────────────────────
YOUTUBE_API_KEY="AIza..."
GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
YOUTUBE_REDIRECT_URI="http://localhost:3000/api/auth/youtube/callback"

# ── Twitch ────────────────────────────────────────────────────────────────────
TWITCH_CLIENT_ID="..."
TWITCH_CLIENT_SECRET="..."
TWITCH_REDIRECT_URI="http://localhost:3000/api/auth/twitch/callback"

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
│   ├── page.tsx                  # Root — redirects to dashboard by role
│   ├── onboarding/               # Role selection & age verification
│   ├── sign-in/ & sign-up/       # Clerk auth pages
│   ├── creator/                  # Creator dashboard
│   │   ├── campaigns/            # Browse & apply for campaigns
│   │   ├── deal-room/            # Manage submissions & proof of work
│   │   ├── academy/              # Educational content & XP system
│   │   └── profile/ & settings/
│   ├── sponsor/                  # Sponsor dashboard
│   │   ├── campaigns/            # Create & manage campaigns
│   │   ├── creators/             # Discover & search creators
│   │   ├── deal-room/            # Review creator submissions
│   │   └── payouts/ & profile/ & settings/
│   ├── admin/                    # Admin dashboard
│   │   ├── users/                # User management
│   │   ├── campaigns/            # Campaign oversight
│   │   ├── verification-queue/   # Age restriction requests
│   │   └── academy/ & reports/ & settings/
│   ├── api/
│   │   ├── auth/twitch/          # Twitch OAuth callback
│   │   ├── auth/youtube/         # YouTube OAuth callback
│   │   ├── stripe/               # Payment intents, webhooks, payouts, refunds
│   │   ├── notifications/        # Notification endpoints
│   │   └── cron/recalculate-ctr/ # Daily CTR recalculation
│   └── r/                        # Tracking redirect handler (affiliate links)
├── components/                   # React components by role/domain
├── lib/                          # Business logic & service clients
│   ├── prisma.ts                 # Prisma client singleton
│   ├── stripe.ts                 # Stripe client singleton
│   ├── email.ts                  # Resend email delivery
│   ├── notifications.ts          # Notification creation with deduplication
│   ├── twitch.ts                 # Twitch Helix API utilities
│   ├── youtube.ts                # YouTube Data API v3 utilities
│   ├── token-encryption.ts       # AES-256-GCM token encryption
│   ├── matching.ts               # Creator–campaign matching engine
│   └── ctr.ts                    # Click-through rate calculation
└── hooks/
prisma/
├── schema.prisma                 # Database schema
└── seed.ts                       # Test data seeder
vercel.json                       # Deployment & cron configuration
```

---

## Database Schema

### Models

| Model | Description |
|---|---|
| `content_creators` | Creator profiles — platform stats, Stripe Connect status, audience demographics |
| `sponsors` | Sponsor/brand profiles — company info, targeting criteria, Stripe customer ID |
| `admins` | Admin user records |
| `campaigns` | Marketing campaigns — budget, targeting criteria, status, payment intent |
| `campaign_applications` | Creator applications to campaigns — pending / accepted / rejected |
| `deal_submissions` | Proof of work — proof URLs, CTR, payout status, Stripe transfer ID |
| `link_clicks` | Affiliate link click tracking for CTR calculation |
| `sponsor_age_restriction_requests` | Requests to enable 18+ campaign targeting (requires admin approval) |
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
2. **Profile Setup** — Link Twitch and/or YouTube accounts via OAuth. The app fetches and stores subscriber counts, average VOD views, top game categories, and engagement metrics. OAuth tokens are AES-256-GCM encrypted before storage.
3. **Campaign Discovery** — Browse live campaigns surfaced by the matching engine. Matching scores campaigns on platform overlap, content type, audience size, and engagement rate with hard blocks for extreme stat mismatches.
4. **Application** — Apply to a campaign with an optional message. Application is created with status `pending`.
5. **Acceptance & Submission** — Once accepted, submit proof of work (YouTube/Twitch URLs). Audience clicks are tracked via `/r/<code>` redirect links; a daily cron fetches current view counts and recalculates CTR.
6. **Payout** — Creator onboards with Stripe Connect. On submission approval, a Stripe Connect transfer is initiated. The `transfer.created` webhook marks the submission `paid` and sends a notification.

### Sponsor Flow

1. **Sign up & Onboarding** — Register via Clerk, verify age (18+), select Sponsor role.
2. **Campaign Creation** — Define budget, target platforms, creator criteria (min subscribers, min engagement rate, audience demographics), and campaign deliverables. Campaign saved as `draft`.
3. **Age Restriction (optional)** — Request 18+ creator targeting via the admin verification queue.
4. **Campaign Launch** — Pay via card or ACH bank transfer through Stripe. `payment_intent.succeeded` webhook advances campaign to `live` and makes it visible to matching creators.
5. **Application Review** — Accept or reject creator applications. Notifications are sent to creators automatically.
6. **Submission Review** — Review deal submissions with proof URLs and CTR data. Approve or request revisions.
7. **Payouts** — Approved submissions trigger Stripe Connect transfers to creators. Export payout ledger as CSV from the Payouts page.

### Admin Flow

1. **Verification Queue** — Review and approve/reject sponsor age-restriction requests.
2. **User Management** — View and manage creators, sponsors, and admins across the platform.
3. **Campaign Oversight** — Monitor all campaigns and application statuses.
4. **Academy** — Create and manage educational content for creators.
5. **Reports** — Access platform-wide analytics and reporting.

---

## Payments & Payouts

The payment model is a two-step transfer:

1. **Sponsor → Platform:** Sponsor pays the full campaign budget via Stripe (card or ACH). The platform retains `PLATFORM_FEE_PERCENT` (default 15%).
2. **Platform → Creator:** After a submission is approved, the platform initiates a Stripe Connect transfer to the creator's connected account for their share of the budget.

### Stripe Webhook Events

The endpoint `/api/stripe/webhook` handles:

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Advances campaign from `pending_payment` to `live` |
| `charge.succeeded` | Records charge ID on the campaign; sends confirmation email to sponsor |
| `transfer.created` | Marks deal submission payout as `paid`; notifies creator |
| `transfer.failed` | Marks payout as `failed`; notifies creator and admin |

---

## Cron Jobs

Configured in `vercel.json` and executed by Vercel's cron scheduler.

| Endpoint | Schedule | Purpose |
|---|---|---|
| `/api/cron/recalculate-ctr` | Daily at midnight UTC | Fetches live view counts from YouTube & Twitch APIs for all active deal submissions, then recalculates CTR as `(link_clicks / avg_video_views) * 100` |

The cron endpoint requires an `Authorization: Bearer <CRON_SECRET>` header, which Vercel sends automatically when `CRON_SECRET` is configured in project settings.

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
