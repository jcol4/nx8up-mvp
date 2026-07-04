/**
 * Curated macro-region catalog for audience targeting.
 *
 * A second, optional tier layered on top of country-level audience targeting.
 * Only US and Brazil have curated regions today (additive — add more later).
 *
 * `value` is the stable canonical key stored in the DB and used for matching.
 * `label` is a dev-facing fallback only — the UI resolves display labels via
 * i18n (`region.<value>`), so pt-BR users see translated region names.
 *
 * Kept in `src/lib` (not the campaign wizard `_shared.ts`) so both the UI
 * catalog and the matching engine can depend on it without a layering issue.
 */

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

/** Regions curated for a given country ([] when the country has no region tier). */
export function regionsForCountry(country: string) {
  return AUDIENCE_REGIONS.filter(r => r.country === country)
}

/** Canonical region key → parent country, for containment/partial-credit matching. */
export const REGION_TO_COUNTRY: Record<string, string> = Object.fromEntries(
  AUDIENCE_REGIONS.map(r => [r.value, r.country]),
)
