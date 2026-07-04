import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { submitRefundVerdict } from '../../app/[locale]/admin/refund-requests/_actions'
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
  },
}))

vi.mock('../reputation', () => ({
  recordReputationEvent: vi.fn().mockResolvedValue({ delta: 0 }),
}))

vi.mock('../notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(null),
}))

// next/cache is required by the server action
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { auth } from '@clerk/nextjs/server'
import { createNotification } from '../notifications'
import { recordReputationEvent } from '../reputation'

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

  it('valid + no accepted: records refund_ruled with hadAcceptedApplications false', async () => {
    const res = await submitRefundVerdict('req-1', 'valid')
    expect(res.success).toBe(true)
    expect(recordReputationEvent).toHaveBeenCalledWith({
      type: 'refund_ruled', sponsorId: 'sponsor-1', verdict: 'valid', hadAcceptedApplications: false,
    })
  })

  it('valid + had accepted: records refund_ruled with hadAcceptedApplications true', async () => {
    vi.mocked(prisma.refund_requests.findUnique).mockResolvedValue({ ...pendingRequest, had_accepted_applications: true } as any)
    await submitRefundVerdict('req-1', 'valid')
    expect(recordReputationEvent).toHaveBeenCalledWith({
      type: 'refund_ruled', sponsorId: 'sponsor-1', verdict: 'valid', hadAcceptedApplications: true,
    })
  })

  it('invalid + no accepted: records an invalid refund_ruled event', async () => {
    await submitRefundVerdict('req-1', 'invalid')
    expect(recordReputationEvent).toHaveBeenCalledWith({
      type: 'refund_ruled', sponsorId: 'sponsor-1', verdict: 'invalid', hadAcceptedApplications: false,
    })
  })

  it('invalid + had accepted: records an invalid refund_ruled event', async () => {
    vi.mocked(prisma.refund_requests.findUnique).mockResolvedValue({ ...pendingRequest, had_accepted_applications: true } as any)
    await submitRefundVerdict('req-1', 'invalid')
    expect(recordReputationEvent).toHaveBeenCalledWith({
      type: 'refund_ruled', sponsorId: 'sponsor-1', verdict: 'invalid', hadAcceptedApplications: true,
    })
  })

  it('sends notification with "accepted as valid" for valid verdict', async () => {
    await submitRefundVerdict('req-1', 'valid')
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('accepted as valid') }),
    )
  })

  it('sends notification with "marked as invalid" and score delta for invalid verdict', async () => {
    vi.mocked(recordReputationEvent).mockResolvedValue({ delta: -10, score: -10, tier: 'restricted' })
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
