import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))
vi.mock('../refund-verdict', () => ({ resolveRefundVerdict: vi.fn() }))

import { auth } from '@clerk/nextjs/server'
import { resolveRefundVerdict } from '../refund-verdict'
import { POST } from '../../app/api/admin/refund-requests/[id]/verdict/route'

const adminClaims = { sessionClaims: { metadata: { role: 'admin' } } }

function post(body: unknown, id = 'req-1') {
  const request = new Request('https://example.com', { method: 'POST', body: JSON.stringify(body) })
  return POST(request, { params: Promise.resolve({ id }) })
}

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue(adminClaims as any)
  vi.mocked(resolveRefundVerdict).mockResolvedValue({ kind: 'resolved' })
})

afterEach(() => vi.clearAllMocks())

// The route is a thin transport over the shared resolveRefundVerdict core — the same core
// the admin server action uses. These tests lock in that it delegates (rather than carrying
// its own copy of the money/reputation logic) and maps each outcome to the right status.
describe('POST /api/admin/refund-requests/[id]/verdict', () => {
  it('returns 401 and never touches the core when the caller is not an admin', async () => {
    vi.mocked(auth).mockResolvedValue({ sessionClaims: { metadata: { role: 'sponsor' } } } as any)
    const res = await post({ verdict: 'valid' })
    expect(res.status).toBe(401)
    expect(resolveRefundVerdict).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid verdict value', async () => {
    const res = await post({ verdict: 'maybe' })
    expect(res.status).toBe(400)
    expect(resolveRefundVerdict).not.toHaveBeenCalled()
  })

  it('delegates to the shared core and returns 200 on resolved', async () => {
    const res = await post({ verdict: 'valid', adminNotes: 'looks fine' })
    expect(resolveRefundVerdict).toHaveBeenCalledWith('req-1', 'valid', 'looks fine')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('maps not_found → 404', async () => {
    vi.mocked(resolveRefundVerdict).mockResolvedValue({ kind: 'not_found' })
    const res = await post({ verdict: 'valid' })
    expect(res.status).toBe(404)
  })

  it('maps already_recorded → 400', async () => {
    vi.mocked(resolveRefundVerdict).mockResolvedValue({ kind: 'already_recorded' })
    const res = await post({ verdict: 'invalid' })
    expect(res.status).toBe(400)
  })
})
