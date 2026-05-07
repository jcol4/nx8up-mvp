/**
 * Platform-wide financial constants and fee calculation utilities.
 * All monetary values are in USD cents unless noted otherwise.
 */

/** Platform fee rate derived from NEXT_PUBLIC_PLATFORM_FEE_PERCENT (defaults to 15). */
export const NX_FEE_RATE = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT ?? 15) / 100

/** Maximum allowed campaign budget in USD. Matches Stripe's ACH debit transaction limit. */
export const BUDGET_MAX = 999_999

/**
 * Breaks down a campaign budget into platform fee, creator pool, and per-creator amount.
 * `dust` is the remainder (in dollars) when the creator pool doesn't divide evenly.
 */
export function calcFeeBreakdown(budget: number, creatorCount?: number | null) {
  const fee = Math.round(budget * NX_FEE_RATE)
  const creatorPool = budget - fee
  const perCreator =
    creatorCount && creatorCount > 0 ? Math.floor(creatorPool / creatorCount) : null
  const dust =
    perCreator !== null && creatorCount ? creatorPool - perCreator * creatorCount : 0
  return { fee, creatorPool, perCreator, dust }
}
