import { describe, it, expect } from 'vitest'
import { MISSIONS } from '../missions'

describe('MISSIONS', () => {
  it('contains exactly 20 missions', () => {
    expect(MISSIONS).toHaveLength(20)
  })

  it('every mission has id, title, type, and xp', () => {
    for (const m of MISSIONS) {
      expect(typeof m.id).toBe('string')
      expect(m.id.length).toBeGreaterThan(0)
      expect(typeof m.title).toBe('string')
      expect(['gate', 'field', 'weekly']).toContain(m.type)
      expect(typeof m.xp).toBe('number')
      expect(m.xp).toBeGreaterThan(0)
    }
  })

  it('has exactly 2 gate missions with ids stripe and platform', () => {
    const gates = MISSIONS.filter((m) => m.type === 'gate')
    expect(gates).toHaveLength(2)
    expect(gates.map((m) => m.id).sort()).toEqual(['platform', 'stripe'])
  })

  it('has exactly 11 field missions', () => {
    expect(MISSIONS.filter((m) => m.type === 'field')).toHaveLength(11)
  })

  it('has exactly 7 weekly missions', () => {
    expect(MISSIONS.filter((m) => m.type === 'weekly')).toHaveLength(7)
  })

  it('has no duplicate ids', () => {
    const ids = MISSIONS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
