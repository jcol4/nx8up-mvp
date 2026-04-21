/**
 * Creator XP and leveling system.
 *
 * XP threshold formula: BASE_XP + (level * XP_PER_LEVEL)
 *   Level 1 → 2 requires 400 XP, level 2 → 3 requires 500 XP, etc.
 * Levels cap at 7 for rank name display but continue numerically beyond that.
 */

/** Starting XP threshold for level 1. */
export const BASE_XP = 300

/** Additional XP required per level increment. */
export const XP_PER_LEVEL = 100

/** Returns XP required to advance from `level` to `level + 1`. */
export function getXpForNextLevel(level: number): number {
  return BASE_XP + level * XP_PER_LEVEL
}

/** Display name for each rank tier. Capped at level 7; levels above 7 show "Rank N". */
const RANK_NAMES: Record<number, string> = {
  1: 'Starter',
  2: 'Rising',
  3: 'Setton',
  4: 'Reliable',
  5: 'Pro',
  6: 'Elite',
  7: 'Champion',
}

/** Returns the rank display name for the given level. */
export function getRankName(level: number): string {
  return RANK_NAMES[Math.min(level, 7)] ?? `Rank ${level}`
}

/** Full snapshot of a creator's XP progress, stored on content_creators and used in the UI. */
export type CreatorXpState = {
  /** Current XP within the current level (resets to 0 on level-up). */
  xp: number
  level: number
  /** XP required to reach the next level from 0. */
  xpForNext: number
  /** Human-readable rank name for the current level. */
  rankName: string
}

/** Returns the initial XP state for a brand-new creator (level 1, 0 XP). */
export function createInitialXpState(): CreatorXpState {
  return {
    xp: 0,
    level: 1,
    xpForNext: getXpForNextLevel(1),
    rankName: getRankName(1),
  }
}

/**
 * Applies `amount` XP to the given state, handling multi-level-ups in a single call.
 * Returns a new state object; does not mutate the input.
 */
export function addXpToState(
  state: CreatorXpState,
  amount: number
): CreatorXpState {
  let { xp, level, xpForNext } = state
  xp += amount

  while (xp >= xpForNext) {
    xp -= xpForNext
    level += 1
    xpForNext = getXpForNextLevel(level)
  }

  return {
    xp,
    level,
    xpForNext,
    rankName: getRankName(level),
  }
}
