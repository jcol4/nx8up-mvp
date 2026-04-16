export const NX_FEE_RATE = 0.1 // 10%

/** Stripe's default ACH debit limit — budgets must not exceed this. */
export const BUDGET_MAX = 999_999

export function calcFeeBreakdown(budget: number, creatorCount?: number | null) {
  const fee = Math.round(budget * NX_FEE_RATE)
  const creatorPool = budget - fee
  const perCreator =
    creatorCount && creatorCount > 0 ? Math.floor(creatorPool / creatorCount) : null
  const dust =
    perCreator !== null && creatorCount ? creatorPool - perCreator * creatorCount : 0
  return { fee, creatorPool, perCreator, dust }
}
