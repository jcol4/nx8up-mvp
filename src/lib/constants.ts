/**
 * Platform-wide financial constants and fee calculation utilities.
 * All monetary values are in USD cents unless noted otherwise.
 */

/** Platform fee taken from each campaign budget before paying creators (10%). */
export const NX_FEE_RATE = 0.1

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
