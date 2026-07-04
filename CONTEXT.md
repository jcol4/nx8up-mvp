# nx8up — Domain Context

The shared vocabulary and business rules for nx8up, a two-sided marketplace matching
content **creators** (Twitch / YouTube / Steam) with **sponsors** (brands) running
influencer-marketing **campaigns**. This file is the source of truth for domain
*language* and *invariants*; the [README](README.md) covers setup, env vars, and
operational flow, and is not repeated here.

> When your output (issue titles, tests, refactors, hypotheses) names a domain
> concept, use the term exactly as defined below. Don't drift to synonyms — e.g. say
> **deal submission** / **proof of work**, not "delivery"; **sponsor**, not
> "advertiser"; **application**, not "bid".

---

## The three actors

| Term | Definition | Table |
|---|---|---|
| **Creator** | A content producer with linked platform accounts (Twitch, YouTube, Steam). Discovers and applies to campaigns; submits proof of work; receives payouts via Stripe Connect. | `content_creators` |
| **Sponsor** | A brand that funds and runs campaigns, reviews applicants, and pays via Stripe (card or ACH). | `sponsors` |
| **Admin** | Platform operator. Works a set of approval queues (below) and manages disputes, surveys, academy, and users. | `admins` |

Identity for all three is owned by **Clerk**; the local row is keyed by
`clerk_user_id` and the role lives in Clerk metadata (set during **onboarding**).
Every actor must pass an **18+ age verification** at onboarding.

---

## Core marketplace objects

- **Campaign** (`campaigns`) — a sponsor's marketing brief: budget, targeting
  criteria, deliverables, and payment. Carries a unique `campaign_code`. Advances
  through the **campaign lifecycle** (below). A **direct invite** campaign
  (`is_direct_invite`) targets a specific creator rather than the open pool.
- **Application** (`campaign_applications`) — a creator's request to join a campaign.
  One per (campaign, creator) pair (`@@unique`). Sponsor accepts or rejects.
- **Deal submission** / **proof of work** (`deal_submissions`) — the creator's
  evidence of completed work (proof URLs, screenshot, disclosure confirmation) for an
  *accepted* application. Reviewed by the sponsor; drives payout. One per application.
- **Deal room** — the UI surface (both roles have one) where accepted work is managed:
  creators submit proof, sponsors review it.
- **Link click** (`link_clicks`) — a tracked hit on a creator's `/r/<code>` redirect
  link. The raw signal behind CTR. IPs are stored hashed (`ip_hash`).

---

## State machines (status strings — no DB enums)

All statuses are free-text `String` columns, **not** Postgres enums. Use these exact
values.

**Campaign** (`campaigns.status`):
```
draft → pending_payment → payment_in_progress → live → completed
```
`live` is the only state visible to the matching engine. Advancement past
`pending_payment` is driven by Stripe webhooks, not user clicks.

**Application** (`campaign_applications.status`):
```
pending → accepted | rejected
```

**Deal submission** (`deal_submissions.status`):
```
pending → approved | needs_revision
```

**Payout** (`deal_submissions.payout_status`):
```
null → processing → paid → payout_failed
```
`null` = not yet attempted; `processing` = a transfer slot is claimed / in flight;
`paid` = the Stripe Connect transfer was created; `payout_failed` = the creator's bank
payout bounced (**terminal** — no automatic re-transfer; see issue #6). The money
movement (`initiateCreatorPayout`) and the idempotent `paid` transition with its
consequences — notification + reputation (`settleCreatorPayout`) — both live in
`src/lib/payouts.ts`; the `transfer.created` / `payout.failed` webhooks and the deal-room
approve/retry actions are thin adapters over them. The `paid` / `payout_failed` values
are never written by hand from the UI.

**Verdict queues** (`refund_requests.verdict`, `creator_opt_outs.verdict`,
`sanctioned_launch_requests.verdict`) and **request queues**
(`sponsor_age_restriction_requests.status`): all start `pending` and resolve to an
approved/valid or rejected/invalid terminal value decided by an admin.

**Dispute** (`disputes.status`): `draft → …` mirrors Stripe's dispute submission
lifecycle; evidence is assembled by an admin before submission.

---

## Matching engine (`src/lib/matching.ts`)

`matchCreatorToCampaign(creator, campaign)` returns `{ eligible, score, reasons, notes }`.
Only `live` campaigns are matched; only the criteria a campaign *actually specifies*
contribute.

- **Hard blocks** (`eligible = false`): creator not available, or a numeric minimum
  (followers / avg viewers / engagement) where the creator is below **`TOLERANCE = 0.67`**
  (i.e. under 67% of the requirement).
  > ⚠️ The prose docstring at the top of the file still says "75% / 25% below" — the
  > authoritative value is the `TOLERANCE` constant (0.67). Treat mismatches like this
  > as a doc bug, not a spec.
- **Soft criteria** (contribute to a 0–100 weighted `score`, never block). Weight
  budget: Platform 20, Min followers 15, Min avg viewers 15, CTR 10, Creator types 8,
  Creator size 7, Game categories 7, Content types 5, Audience location 5, Audience age 4,
  Audience interests 4, Campaign type 3, Product type 3, Audience gender 3.
- **Tag matching** is normalization- + synonym-aware (`tag-synonyms.ts`): case/
  punctuation-insensitive, so "CS:GO" ≈ "cs go" and "FPS" ≈ "Shooter" ≈ "Valorant".

**Creator size** tiers (`computeCreatorSize`, by total followers):
`nano` < 10k ≤ `micro` < 50k ≤ `mid` < 250k ≤ `large`.

---

## Reputation & tiers (`src/lib/reputation.ts`)

Both creators and sponsors carry a `reputation_score` (Int) and derived
`reputation_tier`. Tiers, by score:

| Tier | Score range | Meaning |
|---|---|---|
| `sanctioned` | ≤ −30 | Blocked — campaigns require admin approval to launch |
| `restricted` | −29 … −10 | 14-day payment→start cooldown |
| `neutral` | −9 … 9 | 7-day cooldown (default for new accounts) |
| `trusted` | 10 … 29 | 3-day cooldown |
| `verified` | ≥ 30 | No cooldown |

**Sponsor cooldown** = minimum days between `payment_confirmed_at` and campaign
`start_date`, enforced per tier (`TIER_COOLDOWN_DAYS`, `earliestStartDate`). A
`sanctioned` sponsor cannot self-launch — this is what feeds the **sanctioned launch
request** queue.

**Score deltas:**
- Creator completion bonus `+5`; late penalty `−1`/day capped at `−10`; level-up `+1`
  per level gained.
- Creator opt-out: valid `0`, invalid `−10` (`OPT_OUT_SCORE_DELTAS`).
- Sponsor full-payout bonus `+3` once every accepted creator on a campaign is paid.
- Sponsor refund (`REFUND_SCORE_DELTAS`, keyed on verdict × whether the campaign had
  accepted applications): `valid_no_accepted 0`, `valid_had_accepted −5`,
  `invalid_no_accepted −10`, `invalid_had_accepted −15`.

**Reputation event seam** — reputation only moves through **`recordReputationEvent(event)`**.
Callers name the domain event that happened (`deal_completed`, `opt_out_ruled`,
`leveled_up`, `proof_late`, `refund_ruled`, `campaign_fully_paid`); the module owns *how
much* it's worth (`reputationDelta`, the single source of the encoding above), *who* it
lands on, and the atomic apply. No caller writes `reputation_score` directly or re-derives
a delta — the raw-delta escape hatch is gone, so the encoding can't drift across call
sites (it used to be duplicated byte-for-byte across the two refund-verdict handlers). The
score is moved with an atomic `increment` (concurrent events can't lose each other's
delta); the derived tier can lag one event under true concurrency and self-heals on the
next. `recordReputationEvent` is the single choke point where the audit ledger (issue #7)
will slot in with zero caller changes.

**Proof deadline** = campaign `end_date` + 7 days (`proofDeadline`). Missing it accrues
late penalties (daily `late-penalties` cron).

---

## Creator progression (gamification)

- **XP & level** (`creator-xp.ts`): threshold to reach the next level is
  `BASE_XP(300) + level * XP_PER_LEVEL(200)`. Ranks 1–7 have names
  (Starter, Rising, Setton, Reliable, Pro, Elite, Champion); above 7 shows "Rank N".
- **Mission** (`creator_missions`, defined in `missions.ts`) — a task that awards XP.
  Three **mission types**:
  - `gate` — onboarding blockers, pinned until permanently done (e.g. connect Stripe,
    connect a platform).
  - `field` — permanently completed once a profile field is populated.
  - `weekly` — repeatable; a fresh set is assigned every Monday (`assign-missions`
    cron, `mission-assignment.ts`), and completion is detected by `mission-resolver.ts`.
- **Academy** (`academy-lessons.ts`) — educational lessons for creators, admin-authored.

---

## Payments (`src/lib/stripe.ts`, `/api/stripe`)

Two-step flow:
1. **Sponsor → Platform**: sponsor pays the full campaign budget (card or ACH). The
   platform keeps `NEXT_PUBLIC_PLATFORM_FEE_PERCENT` (default **15%**).
2. **Platform → Creator**: on submission approval, a **Stripe Connect** transfer sends
   the creator's share to their connected account (`stripe_connect_id`;
   `stripe_onboarding_complete` gates payout eligibility).

Campaign status and payout status are **webhook-driven** — see the README's Stripe
webhook table for the full event→action map. A `charge.dispute.created` webhook opens
a **dispute** (`disputes` + `dispute_events` audit log) for admin handling.

---

## CTR — the trust signal (`src/lib/ctr.ts`)

**CTR = (tracked link clicks / avg video views) × 100**, capped at 999.99%.

View counts are fetched **server-side** from the YouTube/Twitch APIs (creators cannot
self-report views) by the daily `recalculate-ctr` cron. Per-submission CTR is stored on
`deal_submissions.ctr`; the creator's aggregate is averaged into
`content_creators.engagement_rate`, which then feeds the matching engine's CTR weight.

---

## Admin approval queues (one screen each under `/admin`)

| Queue | Backing table | What the admin decides |
|---|---|---|
| Verification | `sponsor_age_restriction_requests` | Allow a sponsor to target 18+ creators |
| Sanctioned launch | `sanctioned_launch_requests` | Let a sanctioned/flagged campaign go live |
| Refund requests | `refund_requests` | Rule on a sponsor's refund; may dock sponsor reputation |
| Opt-outs | `creator_opt_outs` | Whether a creator's exit from an accepted deal is valid |
| Disputes | `disputes` | Assemble evidence, write executive summary, submit to Stripe |
| Sponsor profile changes | (Clerk/profile flow) | Approve verification-sensitive sponsor edits |

---

## Platform integrations & vocabulary

- **Twitch** — OAuth (Helix API); syncs followers, broadcaster type, avg VOD/clip views.
  Refresh tokens are **AES-256-GCM encrypted at rest** (`token-encryption.ts`).
- **YouTube** — OAuth (Data API v3); syncs subscribers, avg views, categories. Tokens
  encrypted at rest.
- **Steam** — **OpenID 2.0** (no OAuth token); read-only public profile: top/recent
  games, visibility. Used for game-category signal and the admin/creator/sponsor
  **Steam lookup** tools.

**Platform sync seam** (`platform-sync.ts`) — "refresh this creator's platform stats
onto their row, if stale" lives behind one interface, `CreatorPlatformSyncer`.
`syncCreatorPlatform(userId, syncer)` owns the shared skeleton (configured? → linked? →
stale? → sync → `recomputeCreatorSize` → recompute CTR → revalidate); each platform is
an adapter. **Twitch and YouTube are the two adapters today**; a new stat platform is a
new adapter, not another copy of the skeleton. **Steam is deliberately *not* a syncer** —
it has no staleness/follower/refresh cadence (it's a read-only lookup). It becomes an
adapter only if it grows a sync cadence (a `steam_synced_at` column + a stale re-pull) —
so don't re-suggest folding Steam behind this seam without that.

---

## Conventions & gotchas

- **Tables are `snake_case` plural** (`content_creators`, `campaigns`) — but the newer
  models are **PascalCase** (`Notification`, `Survey`, `SurveyQuestion`,
  `SurveyResponse`, `NotificationPreference`). This split is historical; match the
  existing name, don't "fix" it.
- **UUID PKs** (`gen_random_uuid()`) on the original tables; **cuid** on the newer
  PascalCase models. Both coexist.
- **Statuses/tiers/verdicts are plain strings**, not enums — validate against the
  values documented above.
- **Notifications** are deduplicated via `dedupeKey` (`notifications.ts`); respect
  `NotificationPreference.prefs` before sending.
- **i18n**: UI strings are extracted to `en` / `pt-BR`; option/enum labels live in a
  shared catalog with locale-aware date/number formatting. (See the auto-memory notes.)
- **Cron endpoints** require `Authorization: Bearer <CRON_SECRET>`; Vercel injects it.
- **Stack**: Next.js 16 (App Router) · React 19 · Prisma 7 + Neon serverless adapter ·
  Tailwind 4 · Clerk · Stripe · Resend · Vitest.

---

## Architectural decisions

No ADRs recorded yet (`docs/adr/` is empty). When a non-obvious decision gets made or
resolved, record it there (see `docs/agents/domain.md`) and link it from here.
