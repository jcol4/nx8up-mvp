import { describe, it, expect } from 'vitest'
import { getXpForNextLevel, addXpToState, createInitialXpState } from '../creator-xp'

describe('getXpForNextLevel', () => {
  it('level 1 requires 500 XP (300 + 1*200)', () => {
    expect(getXpForNextLevel(1)).toBe(500)
  })

  it('level 2 requires 700 XP (300 + 2*200)', () => {
    expect(getXpForNextLevel(2)).toBe(700)
  })

  it('level 5 requires 1300 XP (300 + 5*200)', () => {
    expect(getXpForNextLevel(5)).toBe(1300)
  })
})

describe('addXpToState', () => {
  it('accumulates XP without leveling up', () => {
    const state = createInitialXpState()
    const next = addXpToState(state, 100)
    expect(next.level).toBe(1)
    expect(next.xp).toBe(100)
  })

  it('levels up when XP meets threshold', () => {
    const state = createInitialXpState()
    const next = addXpToState(state, 500)
    expect(next.level).toBe(2)
    expect(next.xp).toBe(0)
  })

  it('handles multi-level-up in one call', () => {
    const state = createInitialXpState()
    // level 1→2 costs 500, level 2→3 costs 700 → need 1200 total
    const next = addXpToState(state, 1200)
    expect(next.level).toBe(3)
    expect(next.xp).toBe(0)
  })

  it('carries over remainder XP after level-up', () => {
    const state = createInitialXpState()
    const next = addXpToState(state, 550)
    expect(next.level).toBe(2)
    expect(next.xp).toBe(50)
  })
})
