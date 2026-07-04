# Plan: Regional Campaign Targeting (US + Brazil macro-regions)

**Status:** Approved design, ready for implementation.
**Audience:** implementing agent (no prior context from the design discussion — everything needed is below).
**Scope:** additive feature. No existing data migration, no breaking changes to current country-level targeting.

## 1. Problem & goal

Today sponsors and creators tag location only at the **country** level, via flat string arrays
(e.g. `"United States"`, `"Brazil"`) compared by exact string overlap. Sponsors want to target
narrower regions within a country (e.g. "Northeast US", "Norte do Brasil") for more precise campaigns.

This must be **additive**: existing country-level targeting keeps working unchanged. Regions are a
second, optional, finer-grained tier layered on top — a sponsor/creator can use country only, region
only (implies its country), or both.

## 2. Current state (reference)

- `prisma/schema.prisma`:
  - `content_creators.audience_locations: String[]` — creator's self-reported audience countries.
  - `campaigns.required_audience_locations: String[]` — sponsor's targeting countries.
  - `campaign_applications.app_audience_locations: String[]` and `app_location: String?` — snapshot
    of creator's location data taken at application time (so later profile edits don't retroactively
    change historical applications).
- `src/app/[locale]/sponsor/campaigns/new/_shared.ts` line ~149 — `AUDIENCE_LOCATIONS` flat array of
  17 country strings, same file/pattern as `PLATFORMS`, `GENDERS`, `CREATOR_TYPES`, etc. (all `as const`).
- `src/app/[locale]/sponsor/campaigns/new/steps/Step2Audience.tsx` (~line 158-171) — toggle-button
  multi-select over `AUDIENCE_LOCATIONS` for `required_audience_locations`, plus a free-text
  `target_cities` input. Toggle pattern: `toggle('required_audience_locations', loc)`,
  `toggleBtn(draft.required_audience_locations.includes(loc))`.
- `src/app/[locale]/creator/profile/steps/Step5BrandPreferences.tsx` — same toggle-button pattern,
  writes to `audience_locations` on the creator.
- `src/app/[locale]/creator/profile/steps/Step3CreatorIdentity.tsx` (~line 121-163) — separate,
  unrelated location fields (`country`/`state`/`city` — the creator's own location, not audience
  location). Demonstrates the existing **conditional-reveal pattern**: state `<FormSelect>` only
  renders `{stateOptionsForCountry(draft.country).length > 0 && (...)}`. Reuse this same conditional
  pattern for region reveal, but applied to the toggle-button UI in Step2Audience/Step5BrandPreferences
  instead of a `<FormSelect>`.
- `src/lib/location-options.ts` — `COUNTRIES`, `US_STATES`, `CA_PROVINCES`, `UK_NATIONS`,
  `parseLocation()`/`formatLocation()`. Unrelated to audience targeting; do not touch.
- `src/lib/matching.ts`:
  - `overlapRatio(required: string[], available: string[])` (line 142) — `matched.length / required.length`,
    using fuzzy/synonym-aware `tagsMatch`.
  - `addScore(weight, ratio)` (line 206) — accumulates `totalWeight += weight` and
    `earnedScore += weight * ratio`. Final score is `earnedScore / totalWeight * 100`ish (see
    surrounding code) — i.e. **only criteria the campaign actually specifies contribute**, and each
    criterion's weight is baked into the shared denominator.
  - Audience-location scoring block, line ~317-326:
    ```ts
    if (campaign.required_audience_locations.length > 0 && creator.audience_locations.length > 0) {
      const ratio = overlapRatio(campaign.required_audience_locations, creator.audience_locations)
      addScore(5, ratio)
      if (ratio === 0) {
        notes.push(`Audience locations: campaign targets ${campaign.required_audience_locations.join(', ')}`)
      }
    }
    ```
  - `CampaignCriteria` type (line ~21) has `required_audience_locations: string[]`; creator-side type
    (referenced ~line 74) has `audience_locations: string[]`.
- Sponsor dashboard "matched creators" preview
  (`src/lib/sponsor-dashboard-cache.ts::getSponsorMatchedCreatorsPreviewCached`, ~line 132-217) calls
  `matchCreatorToCampaign` from `matching.ts` — automatically inherits any changes made there, no
  separate work needed.
- `/sponsor/creators` full directory page (`src/app/[locale]/sponsor/creators/page.tsx`) has its own
  separate Prisma query/filter logic (platform + creator_size only, no location filtering at all,
  not even country-level). **Explicitly out of scope** — do not touch this page as part of this work.

## 3. Design decisions (all confirmed, do not re-litigate)

1. **Additive, two-tier hierarchy.** Country tier stays exactly as-is. Region tier is new and optional.
2. **Only US and Brazil get curated regions initially.** All other countries in `AUDIENCE_LOCATIONS`
   remain country-only — no region catalog entries for them (add more countries later; it's additive).
3. **Region catalog (fixed, curated, not derived from states):**
   - US: `Northeast`, `Southeast`, `Midwest`, `West`
   - Brazil (official IBGE regions): `Norte`, `Nordeste`, `Centro-Oeste`, `Sudeste`, `Sul`
4. **Region values are stable canonical keys**, not raw display strings — e.g. `us_northeast`,
   `us_southeast`, `us_midwest`, `us_west`, `br_norte`, `br_nordeste`, `br_centro_oeste`,
   `br_sudeste`, `br_sul`. Display labels are resolved via i18n (`next-intl`) at render time, in both
   `en` and `pt-BR` locale files. This deliberately diverges from the existing raw-string country
   list convention, because region labels must be translated (pt-BR users need Portuguese region
   names) and matching/containment logic should key off stable identifiers, not locale-dependent text.
5. **New schema fields, parallel to existing ones** (see §4). Do NOT overload the existing
   `audience_locations` / `required_audience_locations` arrays with region values — keep the two tiers
   in fully separate fields so existing matching/UI code for countries is untouched.
6. **Region selection is nested under its parent country in the UI.** Checking "United States" in the
   country toggle-list reveals a secondary row of US region toggle-buttons beneath it; checking
   "Brazil" reveals Brazil's regions. Countries without a curated region list show nothing extra.
   This mirrors the existing `stateOptionsForCountry()` conditional-reveal pattern in
   `Step3CreatorIdentity.tsx`, applied to the toggle-button components instead of `<FormSelect>`.
7. **Matching: region match is a bonus on top of the existing country score, not an independently
   weighted criterion.** Keep the existing `addScore(5, ratio)` call for country-level
   `audience_locations` exactly as-is. Separately, if both campaign and creator have region data with
   overlap, add a capped bonus directly to `earnedScore` (NOT to `totalWeight` — a bonus must not
   change the denominator, only nudge the numerator up). Suggested: `earnedScore += 2 * regionRatio`,
   capped so the region bonus never exceeds e.g. 2 points absolute. This avoids double-counting
   location as two independent weighted dimensions, which would let location dominate total score
   disproportionately.
8. **Partial-credit containment matching:** a campaign targeting a region should also give partial
   credit to creators who have only set the parent country (no region chosen yet), since region
   adoption among existing creators will lag. Concretely: when computing the region bonus, if a
   campaign's `required_audience_regions` has entries but a creator's `audience_regions` is empty,
   fall back to checking whether the creator's `audience_locations` contains the parent country of the
   requested region(s) — if so, award **half** the bonus ratio for those regions instead of zero.
9. **Snapshot fields on `campaign_applications` mirror the existing pattern exactly** — freeze region
   data at application time just like `app_audience_locations`/`app_location` do today, populated the
   same way at the same point in the application flow.
10. **`/sponsor/creators` directory page location filtering is explicitly out of scope** for this
    change (pre-existing gap, unrelated — don't add it here).

## 4. Schema changes (`prisma/schema.prisma`)

Add these fields (new migration, additive only — no changes to existing columns):

```prisma
model content_creators {
  // ... existing fields ...
  audience_locations         String[]   // existing, untouched
  audience_regions           String[]   @default([])   // NEW
}

model campaigns {
  // ... existing fields ...
  required_audience_locations String[]  // existing, untouched
  required_audience_regions   String[]  @default([])   // NEW
}

model campaign_applications {
  // ... existing fields ...
  app_audience_locations String[]   // existing, untouched
  app_location           String?    // existing, untouched
  app_audience_regions   String[]   @default([])   // NEW
  app_required_regions   String[]   @default([])   // NEW
}
```

Generate and apply a Prisma migration for these additions. No backfill needed (all existing rows get
empty arrays by default).

## 5. Catalog (`src/app/[locale]/sponsor/campaigns/new/_shared.ts`)

Add a new export alongside `AUDIENCE_LOCATIONS`, following the existing object-array style used by
`CREATOR_TYPES`/`MEDIA_TYPES` (value + label + parent):

```ts
export const AUDIENCE_REGIONS = [
  { value: 'us_northeast',    label: 'Northeast',     country: 'United States' },
  { value: 'us_southeast',    label: 'Southeast',     country: 'United States' },
  { value: 'us_midwest',      label: 'Midwest',       country: 'United States' },
  { value: 'us_west',         label: 'West',          country: 'United States' },
  { value: 'br_norte',        label: 'Norte',         country: 'Brazil' },
  { value: 'br_nordeste',     label: 'Nordeste',      country: 'Brazil' },
  { value: 'br_centro_oeste', label: 'Centro-Oeste',  country: 'Brazil' },
  { value: 'br_sudeste',      label: 'Sudeste',       country: 'Brazil' },
  { value: 'br_sul',          label: 'Sul',           country: 'Brazil' },
] as const

export function regionsForCountry(country: string) {
  return AUDIENCE_REGIONS.filter(r => r.country === country)
}
```

Note: `label` here is a fallback/dev-facing string only — actual UI display should go through i18n
message keys (see §7), keyed by `value` (e.g. `t(`region.${value}`)`), consistent with how other
enum labels in this codebase are translated via `useTranslations` rather than embedding translated
text in the catalog array itself.

## 6. UI changes

### 6.1 `Step2Audience.tsx` (sponsor campaign creation, writes `required_audience_regions`)

Below the existing `AUDIENCE_LOCATIONS` toggle block (~line 163-170), for each country currently
selected in `draft.required_audience_locations`, conditionally render its region toggle-buttons:

```tsx
{draft.required_audience_locations.map(country => {
  const regions = regionsForCountry(country)
  if (regions.length === 0) return null
  return (
    <div key={country}>
      <label className={labelClass}>{tr('s2Regions', { country })}</label>
      <div className="flex flex-wrap gap-2">
        {regions.map(r => (
          <button
            key={r.value}
            type="button"
            onClick={() => toggle('required_audience_regions', r.value)}
            className={toggleBtn(draft.required_audience_regions.includes(r.value))}
          >
            {tr(`region.${r.value}`)}
          </button>
        ))}
      </div>
    </div>
  )
})}
```

When a country is deselected in `required_audience_locations`, also strip any of its region values
from `required_audience_regions` (so stale selections don't linger invisibly) — do this in the
existing `toggle('required_audience_locations', loc)` handler: after removing `loc`, filter
`required_audience_regions` to drop any region whose `country` matches the removed one.

### 6.2 `Step5BrandPreferences.tsx` (creator profile, writes `audience_regions`)

Same nested conditional-reveal pattern as above, mirrored for the creator's `audience_locations` /
`audience_regions` fields.

### 6.3 Draft/form state types

Wherever the draft state types for these two steps are defined (look for the `draft` state shape
near each component, likely a `CampaignDraft`/similar type in a shared types file or inline), add
`required_audience_regions: string[]` and `audience_regions: string[]` respectively, defaulting to `[]`.

## 7. i18n

Add message keys for region labels in both locale files (find the existing `en`/`pt-BR` message
JSON/structure used by this project's `next-intl` setup — same files touched during the "i18n Phase 3/4"
creator/sponsor dashboard extraction work). Add a `region` namespace:

- `en`: `region.us_northeast: "Northeast"`, `region.us_southeast: "Southeast"`, `region.us_midwest: "Midwest"`,
  `region.us_west: "West"`, `region.br_norte: "North"`, `region.br_nordeste: "Northeast"`,
  `region.br_centro_oeste: "Center-West"`, `region.br_sudeste: "Southeast"`, `region.br_sul: "South"`
- `pt-BR`: `region.us_northeast: "Nordeste dos EUA"`, `region.us_southeast: "Sudeste dos EUA"`,
  `region.us_midwest: "Meio-Oeste dos EUA"`, `region.us_west: "Oeste dos EUA"`, `region.br_norte: "Norte"`,
  `region.br_nordeste: "Nordeste"`, `region.br_centro_oeste: "Centro-Oeste"`, `region.br_sudeste: "Sudeste"`,
  `region.br_sul: "Sul"`

Also add a `s2Regions` label key (e.g. `"Regions in {country}"` / `"Regiões em {country}"`) for the
section label in Step2Audience/Step5BrandPreferences.

Check whether the "option enums deferred to a shared catalog" work mentioned in prior i18n phases
already established a convention for enum-value translation namespaces before inventing a new one —
search for how existing enum values (e.g. `GENDERS`, `CREATOR_TYPES`) are currently translated, if at
all, and follow that convention for consistency.

## 8. Matching logic (`src/lib/matching.ts`)

### 8.1 Types

Add to `CampaignCriteria` (near `required_audience_locations`, line ~36):
```ts
required_audience_regions: string[]
```
Add to the creator-side type (near `audience_locations`, line ~74):
```ts
audience_regions: string[]
```

### 8.2 Region → country lookup

Import or inline a small map from region canonical key to parent country, matching `AUDIENCE_REGIONS`
in `_shared.ts` (either import that catalog directly if `matching.ts` can depend on it without a
circular/layering issue, or duplicate a minimal `REGION_TO_COUNTRY: Record<string, string>` lookup in
`matching.ts` — check existing import conventions in this file before deciding; `matching.ts` currently
only imports from `./tag-synonyms`, so confirm `_shared.ts` under `src/app/...` is an acceptable
dependency from `src/lib/...` or whether the catalog should be duplicated/moved to `src/lib/` instead).

### 8.3 Scoring changes

Leave the existing country-level block (line ~317-326) completely unchanged. Immediately after it,
add:

```ts
// ── Audience regions (bonus on top of country score, not independently weighted) ──
if (campaign.required_audience_regions.length > 0) {
  let regionRatio = 0
  if (creator.audience_regions.length > 0) {
    regionRatio = overlapRatio(campaign.required_audience_regions, creator.audience_regions)
  } else {
    // Partial credit: creator has country-level data only, no regions set yet.
    const requiredCountries = campaign.required_audience_regions
      .map(r => REGION_TO_COUNTRY[r])
      .filter((c): c is string => !!c)
    const countryMatch = requiredCountries.some(c => creator.audience_locations.includes(c))
    regionRatio = countryMatch ? 0.5 : 0
  }
  const REGION_BONUS_CAP = 2
  earnedScore += REGION_BONUS_CAP * regionRatio
  // Do NOT add to totalWeight — this is a bonus, not an independent criterion.
}
```

Verify against the actual final-score computation later in the function (read past line 340 to see
how `earnedScore`/`totalWeight` are converted into the returned `score`) to confirm adding directly to
`earnedScore` without touching `totalWeight` produces the intended "small nudge" behavior and doesn't
let the score exceed 100 — clamp the final score if necessary.

## 9. Application snapshot population

Find wherever `app_audience_locations` and `app_location` are currently populated when a creator
submits an application (likely the application-creation server action/API route — search for
`app_audience_locations` usage outside `matching.ts` and `schema.prisma`). Add the same snapshot
assignment for `app_audience_regions` (from the creator's current `audience_regions`) and
`app_required_regions` (from the campaign's current `required_audience_regions`) at that exact point.

## 10. Explicitly out of scope (do not implement)

- Any changes to `/sponsor/creators` directory page (`src/app/[locale]/sponsor/creators/page.tsx`) —
  it has no location filtering today at all (not even country-level); adding a region filter there is
  a separate follow-up.
- Region catalogs for any country other than US and Brazil.
- Any lat/lng, map-based picker, or metro-area-level granularity.
- Migrating/backfilling existing `audience_locations`/`required_audience_locations` data.

## 11. Suggested implementation order

1. Prisma schema + migration (§4).
2. Catalog + i18n keys (§5, §7).
3. Matching logic (§8) — can be built and unit-tested independently of UI, using the new fields as
   plain inputs.
4. UI: Step2Audience.tsx, Step5BrandPreferences.tsx (§6).
5. Application snapshot population (§9).
6. Manual verification: create a campaign targeting a US region, apply as a creator with only
   country-level `audience_locations = ["United States"]` set, confirm partial-credit bonus shows up
   in match score; then set the creator's `audience_regions` to the matching region and confirm the
   bonus increases; confirm a campaign with no region targeting is scored identically to before this
   change (no regression to existing country-only matching).
