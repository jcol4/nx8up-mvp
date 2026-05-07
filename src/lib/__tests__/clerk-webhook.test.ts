import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../../app/api/webhooks/clerk/route'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
  prisma: {
    content_creators: { updateMany: vi.fn() },
    sponsors: { updateMany: vi.fn() },
  },
}))

let mockVerify: ReturnType<typeof vi.fn>

vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(function () {
    return { verify: (...args: unknown[]) => mockVerify(...args) }
  }),
}))

import { Webhook } from 'svix'

const WEBHOOK_SECRET = 'whsec_test'
process.env.CLERK_WEBHOOK_SECRET = WEBHOOK_SECRET

const SVIX_HEADERS = {
  'svix-id': 'msg_test',
  'svix-timestamp': '1234567890',
  'svix-signature': 'v1,signature',
}

function makeRequest(body: object) {
  return new Request('http://localhost/api/webhooks/clerk', {
    method: 'POST',
    headers: SVIX_HEADERS,
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mockVerify = vi.fn()
  vi.mocked(Webhook).mockImplementation(function () {
    return { verify: (...args: unknown[]) => mockVerify(...args) }
  } as any)
  vi.mocked(prisma.content_creators.updateMany).mockResolvedValue({ count: 1 })
  vi.mocked(prisma.sponsors.updateMany).mockResolvedValue({ count: 0 })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/webhooks/clerk', () => {
  describe('signature verification', () => {
    it('returns 400 when svix headers are missing', async () => {
      const req = new Request('http://localhost/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 400 when signature verification fails', async () => {
      mockVerify.mockImplementation(() => { throw new Error('Invalid signature') })
      const res = await POST(makeRequest({ type: 'user.deleted', data: { id: 'user-1' } }))
      expect(res.status).toBe(400)
    })

    it('returns 500 when CLERK_WEBHOOK_SECRET is not set', async () => {
      const original = process.env.CLERK_WEBHOOK_SECRET
      delete process.env.CLERK_WEBHOOK_SECRET
      const res = await POST(makeRequest({ type: 'user.deleted', data: { id: 'user-1' } }))
      expect(res.status).toBe(500)
      process.env.CLERK_WEBHOOK_SECRET = original
    })
  })

  describe('user.deleted event', () => {
    beforeEach(() => {
      mockVerify.mockReturnValue({ type: 'user.deleted', data: { id: 'user-1' } })
    })

    it('sets is_deleted=true on content_creators matching the clerk_user_id', async () => {
      await POST(makeRequest({ type: 'user.deleted', data: { id: 'user-1' } }))
      expect(prisma.content_creators.updateMany).toHaveBeenCalledWith({
        where: { clerk_user_id: 'user-1' },
        data: { is_deleted: true },
      })
    })

    it('sets is_deleted=true on sponsors matching the clerk_user_id', async () => {
      await POST(makeRequest({ type: 'user.deleted', data: { id: 'user-1' } }))
      expect(prisma.sponsors.updateMany).toHaveBeenCalledWith({
        where: { clerk_user_id: 'user-1' },
        data: { is_deleted: true },
      })
    })

    it('updates both tables in parallel (both called)', async () => {
      await POST(makeRequest({ type: 'user.deleted', data: { id: 'user-1' } }))
      expect(prisma.content_creators.updateMany).toHaveBeenCalledTimes(1)
      expect(prisma.sponsors.updateMany).toHaveBeenCalledTimes(1)
    })

    it('returns 200 { received: true }', async () => {
      const res = await POST(makeRequest({ type: 'user.deleted', data: { id: 'user-1' } }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({ received: true })
    })
  })

  describe('unhandled event types', () => {
    it('returns 200 without touching the DB for non-user.deleted events', async () => {
      mockVerify.mockReturnValue({ type: 'user.created', data: { id: 'user-1' } })
      const res = await POST(makeRequest({ type: 'user.created', data: { id: 'user-1' } }))
      expect(res.status).toBe(200)
      expect(prisma.content_creators.updateMany).not.toHaveBeenCalled()
      expect(prisma.sponsors.updateMany).not.toHaveBeenCalled()
    })
  })
})
