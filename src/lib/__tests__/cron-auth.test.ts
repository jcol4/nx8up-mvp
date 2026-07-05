import { describe, it, expect, afterEach } from 'vitest'
import { cronAuthStatus } from '../cron-auth'

// The pure decision function is the test surface; assertCronRequest is a thin
// NextResponse wrapper over it.
const ORIGINAL = process.env.CRON_SECRET
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = ORIGINAL
})

function reqWithAuth(header?: string): Request {
  return new Request('https://example.com/api/cron/x', header ? { headers: { authorization: header } } : undefined)
}

describe('cronAuthStatus', () => {
  it('authorizes a request bearing the correct secret', () => {
    process.env.CRON_SECRET = 'topsecret'
    expect(cronAuthStatus(reqWithAuth('Bearer topsecret'))).toBe('ok')
  })

  it('rejects a wrong secret', () => {
    process.env.CRON_SECRET = 'topsecret'
    expect(cronAuthStatus(reqWithAuth('Bearer wrong'))).toBe('unauthorized')
  })

  it('rejects a missing Authorization header', () => {
    process.env.CRON_SECRET = 'topsecret'
    expect(cronAuthStatus(reqWithAuth())).toBe('unauthorized')
  })

  it('accepts the header regardless of its name casing (headers are case-insensitive)', () => {
    process.env.CRON_SECRET = 'topsecret'
    const req = new Request('https://example.com', { headers: { Authorization: 'Bearer topsecret' } })
    expect(cronAuthStatus(req)).toBe('ok')
  })

  it('fails closed when CRON_SECRET is unset — no "Bearer undefined" bypass', () => {
    delete process.env.CRON_SECRET
    expect(cronAuthStatus(reqWithAuth('Bearer undefined'))).toBe('misconfigured')
  })
})
