import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { submitRefundVerdict } from '../../app/admin/refund-requests/_actions'
import { prisma } from '../prisma'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('../prisma', () => ({
  prisma: {
    refund_requests: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    sponsors: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(null),
}))

// next/cache is required by the server action
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { auth } from '@clerk/nextjs/server'
import { createNotification } from '../notifications'

const adminClaims = { sessionClaims: { metadata: { role: 'admin' } } }
const sponsorClaims = { sessionClaims: { metadata: { role: 'sponsor' } } }

const pendingRequest = {
  id: 'req-1',
  verdict: 'pending',
  had_accepted_applications: false,
  sponsor: { id: 'sponsor-1', clerk_user_id: 'user-1' },
  campaign: { title: 'Test Campaign' },
}

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue(adminClaims as any)
  vi.mocked(prisma.refund_requests.findUnique).mockResolvedValue(pendingRequest as any)
  vi.mocked(prisma.refund_requests.update).mockResolvedValue({} as any)
  vi.mocked(prisma.sponsors.findUnique).mockResolvedValue({ reputation_score: 0 } as any)
  vi.mocked(prisma.sponsors.update).mockResolvedValue({} as any)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('submitRefundVerdict', () => {
  it('returns error when not admin', async () => {
    vi.mocked(auth).mockResolvedValue(sponsorClaims as any)
    const res = await submitRefundVerdict('req-1', 'valid')
    expect(res.error).toBe('Unauthorized')
  })

  it('returns error when request not found', async () => {
    vi.mocked(prisma.refund_requests.findUnique).mockResolvedValue(null)
    const res = await submitRefundVerdict('req-1', 'valid')
    expect(res.error).toBe('Refund request not found.')
  })

  it('returns error when verdict already recorded', async () => {
    vi.mocked(prisma.refund_requests.findUnique).mockResolvedValue({ ...pendingRequest, verdict: 'valid' } as any)
    const res = await submitRefundVerdict('req-1', 'valid')
    expect(res.error).toBe('Verdict already recorded.')
  })

  it('valid + no accepted: delta = 0, reputation NOT updated', async () => {
    const res = await submitRefundVerdict('req-1', 'valid')
    expect(res.success).toBe(true)
    expect(prisma.sponsors.update).not.toHaveBeenCalled()
  })

  it('valid + had accepted: delta = -5, reputation updated', async () => {
    vi.mocked(prisma.refund_requests.findUnique).mockResolvedValue({ ...pendingRequest, had_accepted_applications: true } as any)
    await submitRefundVerdict('req-1', 'valid')
    expect(prisma.sponsors.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reputation_score: -5, reputation_tier: 'neutral' }) }),
    )
  })

  it('invalid + no accepted: delta = -10, reputation updated', async () => {
    await submitRefundVerdict('req-1', 'invalid')
    expect(prisma.sponsors.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reputation_score: -10, reputation_tier: 'restricted' }) }),
    )
  })

  it('invalid + had accepted: delta = -15, reputation updated', async () => {
    vi.mocked(prisma.refund_requests.findUnique).mockResolvedValue({ ...pendingRequest, had_accepted_applications: true } as any)
    await submitRefundVerdict('req-1', 'invalid')
    // score 0 + (-15) = -15 → restricted tier (sanctioned requires ≤ -30)
    expect(prisma.sponsors.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reputation_score: -15, reputation_tier: 'restricted' }) }),
    )
  })

  it('sends notification with "accepted as valid" for valid verdict', async () => {
    await submitRefundVerdict('req-1', 'valid')
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('accepted as valid') }),
    )
  })

  it('sends notification with "marked as invalid" and score delta for invalid verdict', async () => {
    await submitRefundVerdict('req-1', 'invalid')
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('marked as invalid'),
      }),
    )
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('-10'),
      }),
    )
  })

  it('saves admin notes to the request', async () => {
    await submitRefundVerdict('req-1', 'valid', 'Reasonable explanation')
    expect(prisma.refund_requests.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ admin_notes: 'Reasonable explanation' }) }),
    )
  })
})
