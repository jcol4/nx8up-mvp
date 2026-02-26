export const BASE_XP = 300
export const XP_PER_LEVEL = 100

/** XP needed to level up from current level (e.g. level 3 needs 500 to reach level 4) */
export function getXpForNextLevel(level: number): number {
  return BASE_XP + level * XP_PER_LEVEL
}

const RANK_NAMES: Record<number, string> = {
  1: 'Starter',
  2: 'Rising',
  3: 'Setton',
  4: 'Reliable',
  5: 'Pro',
  6: 'Elite',
  7: 'Champion',
}

export function getRankName(level: number): string {
  return RANK_NAMES[Math.min(level, 7)] ?? `Rank ${level}`
}

export type CreatorXpState = {
  xp: number
  level: number
  xpForNext: number
  rankName: string
}

export function createInitialXpState(): CreatorXpState {
  return {
    xp: 0,
    level: 1,
    xpForNext: getXpForNextLevel(1),
    rankName: getRankName(1),
  }
}

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
