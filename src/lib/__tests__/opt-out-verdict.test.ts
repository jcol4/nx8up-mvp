import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { submitOptOutVerdict } from '../../app/admin/opt-outs/_actions'
import { prisma } from '../prisma'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('../prisma', () => ({
  prisma: {
    creator_opt_outs: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    content_creators: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(null),
}))

vi.mock('../reputation', () => ({
  adjustCreatorReputation: vi.fn().mockResolvedValue(undefined),
  OPT_OUT_SCORE_DELTAS: { valid: 0, invalid: -10 },
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { auth } from '@clerk/nextjs/server'
import { createNotification } from '../notifications'
import { adjustCreatorReputation } from '../reputation'

const adminClaims = { sessionClaims: { metadata: { role: 'admin' } } }
const creatorClaims = { sessionClaims: { metadata: { role: 'creator' } } }

const pendingOptOut = {
  id: 'opt-1',
  verdict: 'pending',
  creator_id: 'creator-1',
  reason: 'Going on holiday',
  creator: { id: 'creator-1', clerk_user_id: 'user-1' },
  application: { campaign: { title: 'Test Campaign' } },
}

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue(adminClaims as any)
  vi.mocked(prisma.creator_opt_outs.findUnique).mockResolvedValue(pendingOptOut as any)
  vi.mocked(prisma.creator_opt_outs.update).mockResolvedValue({} as any)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('submitOptOutVerdict', () => {
  it('returns error when not admin', async () => {
    vi.mocked(auth).mockResolvedValue(creatorClaims as any)
    const res = await submitOptOutVerdict('opt-1', 'valid')
    expect(res.error).toBe('Unauthorized')
  })

  it('returns error when opt-out not found', async () => {
    vi.mocked(prisma.creator_opt_outs.findUnique).mockResolvedValue(null)
    const res = await submitOptOutVerdict('opt-1', 'valid')
    expect(res.error).toBeDefined()
  })

  it('returns error when verdict already recorded', async () => {
    vi.mocked(prisma.creator_opt_outs.findUnique).mockResolvedValue({ ...pendingOptOut, verdict: 'valid' } as any)
    const res = await submitOptOutVerdict('opt-1', 'valid')
    expect(res.error).toMatch(/already/i)
  })

  it('valid verdict: does not adjust reputation', async () => {
    const res = await submitOptOutVerdict('opt-1', 'valid')
    expect(res.success).toBe(true)
    expect(adjustCreatorReputation).not.toHaveBeenCalled()
  })

  it('invalid verdict: adjusts reputation by -10', async () => {
    const res = await submitOptOutVerdict('opt-1', 'invalid')
    expect(res.success).toBe(true)
    expect(adjustCreatorReputation).toHaveBeenCalledWith('creator-1', -10)
  })

  it('saves verdict and admin notes to the record', async () => {
    await submitOptOutVerdict('opt-1', 'valid', 'Reasonable explanation')
    expect(prisma.creator_opt_outs.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ verdict: 'valid', admin_notes: 'Reasonable explanation' }),
      }),
    )
  })

  it('sends notification to creator on valid verdict', async () => {
    await submitOptOutVerdict('opt-1', 'valid')
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        message: expect.stringContaining('approved'),
      }),
    )
  })

  it('sends notification to creator on invalid verdict with score impact', async () => {
    await submitOptOutVerdict('opt-1', 'invalid')
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        message: expect.stringMatching(/invalid|rejected/i),
      }),
    )
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('-10'),
      }),
    )
  })
})
