import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))

import { auth } from '@clerk/nextjs/server'
import { roleFromClaims, isAdmin, getSessionRole, requireAdmin } from '../admin-auth'

afterEach(() => vi.clearAllMocks())

describe('roleFromClaims / isAdmin', () => {
  it('reads the role out of session-claim metadata', () => {
    expect(roleFromClaims({ metadata: { role: 'admin' } })).toBe('admin')
    expect(roleFromClaims({ metadata: { role: 'creator' } })).toBe('creator')
  })

  it('is undefined for null / undefined / missing metadata', () => {
    expect(roleFromClaims(null)).toBeUndefined()
    expect(roleFromClaims(undefined)).toBeUndefined()
    expect(roleFromClaims({})).toBeUndefined()
  })

  it('isAdmin is true only for the admin role', () => {
    expect(isAdmin({ metadata: { role: 'admin' } })).toBe(true)
    expect(isAdmin({ metadata: { role: 'sponsor' } })).toBe(false)
    expect(isAdmin(null)).toBe(false)
  })
})

describe('getSessionRole / requireAdmin', () => {
  it('requireAdmin resolves for an admin caller', async () => {
    vi.mocked(auth).mockResolvedValue({ sessionClaims: { metadata: { role: 'admin' } } } as any)
    await expect(requireAdmin()).resolves.toBeUndefined()
  })

  it('requireAdmin throws Unauthorized for a non-admin caller', async () => {
    vi.mocked(auth).mockResolvedValue({ sessionClaims: { metadata: { role: 'creator' } } } as any)
    await expect(requireAdmin()).rejects.toThrow('Unauthorized')
  })

  it('requireAdmin throws when unauthenticated (no claims)', async () => {
    vi.mocked(auth).mockResolvedValue({ sessionClaims: null } as any)
    await expect(requireAdmin()).rejects.toThrow('Unauthorized')
  })

  it('getSessionRole returns the resolved role', async () => {
    vi.mocked(auth).mockResolvedValue({ sessionClaims: { metadata: { role: 'sponsor' } } } as any)
    expect(await getSessionRole()).toBe('sponsor')
  })
})
