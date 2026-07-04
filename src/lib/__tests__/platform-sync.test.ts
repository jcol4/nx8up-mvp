import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../prisma', () => ({
  prisma: {
    content_creators: { findUnique: vi.fn(), update: vi.fn() },
  },
}))
vi.mock('../creator-sidebar-cache', () => ({ revalidateCreatorSidebarCache: vi.fn() }))
vi.mock('../oauth-callback-utils', () => ({ triggerCtrRecomputeForUser: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../token-encryption', () => ({ decryptToken: vi.fn(), encryptToken: vi.fn() }))

import { prisma } from '../prisma'
import { revalidateCreatorSidebarCache } from '../creator-sidebar-cache'
import { triggerCtrRecomputeForUser } from '../oauth-callback-utils'
import {
  syncCreatorPlatform,
  isPlatformDataStale,
  recomputeCreatorSize,
  type CreatorPlatformSyncer,
} from '../platform-sync'

afterEach(() => vi.clearAllMocks())

// An in-memory adapter — the seam makes the orchestration testable without any real
// platform API. This is the deepening payoff: the interface is the test surface.
function fakeSyncer(overrides: Partial<CreatorPlatformSyncer> = {}): CreatorPlatformSyncer {
  return {
    platform: 'twitch',
    isConfigured: () => true,
    read: () => ({ accountId: 'acct-1', syncedAt: null }), // null = stale
    sync: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
}

describe('isPlatformDataStale', () => {
  it('is stale when never synced', () => {
    expect(isPlatformDataStale(null)).toBe(true)
  })

  it('is fresh within the window and stale beyond it', () => {
    expect(isPlatformDataStale(new Date(Date.now() - 60 * 60 * 1000))).toBe(false) // 1h ago
    expect(isPlatformDataStale(new Date(Date.now() - 48 * 60 * 60 * 1000))).toBe(true) // 2d ago
  })
})

describe('syncCreatorPlatform', () => {
  beforeEach(() => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue({ subs_followers: 0, youtube_subscribers: 0 } as any)
    vi.mocked(prisma.content_creators.update).mockResolvedValue({} as any)
  })

  it('skips everything when the platform is not configured', async () => {
    const syncer = fakeSyncer({ isConfigured: () => false })
    await syncCreatorPlatform('user-1', syncer)
    expect(prisma.content_creators.findUnique).not.toHaveBeenCalled()
    expect(syncer.sync).not.toHaveBeenCalled()
  })

  it('skips when the creator has not linked the platform', async () => {
    const syncer = fakeSyncer({ read: () => null })
    await syncCreatorPlatform('user-1', syncer)
    expect(syncer.sync).not.toHaveBeenCalled()
    expect(triggerCtrRecomputeForUser).not.toHaveBeenCalled()
  })

  it('skips the fetch when data is still fresh', async () => {
    const syncer = fakeSyncer({ read: () => ({ accountId: 'acct-1', syncedAt: new Date(Date.now() - 60 * 1000) }) })
    await syncCreatorPlatform('user-1', syncer)
    expect(syncer.sync).not.toHaveBeenCalled()
  })

  it('runs post-steps (size, CTR, revalidate) when a stale sync succeeds', async () => {
    const syncer = fakeSyncer()
    await syncCreatorPlatform('user-1', syncer)
    expect(syncer.sync).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', accountId: 'acct-1' }))
    expect(prisma.content_creators.update).toHaveBeenCalled() // recomputeCreatorSize
    expect(triggerCtrRecomputeForUser).toHaveBeenCalledWith('user-1')
    expect(revalidateCreatorSidebarCache).toHaveBeenCalledWith('user-1')
  })

  it('skips post-steps when the sync reports no update (e.g. account vanished)', async () => {
    const syncer = fakeSyncer({ sync: vi.fn().mockResolvedValue(false) })
    await syncCreatorPlatform('user-1', syncer)
    expect(triggerCtrRecomputeForUser).not.toHaveBeenCalled()
    expect(revalidateCreatorSidebarCache).not.toHaveBeenCalled()
  })

  it('swallows adapter errors (fire-and-forget)', async () => {
    const syncer = fakeSyncer({ sync: vi.fn().mockRejectedValue(new Error('api down')) })
    await expect(syncCreatorPlatform('user-1', syncer)).resolves.toBeUndefined()
    expect(revalidateCreatorSidebarCache).not.toHaveBeenCalled()
  })
})

describe('recomputeCreatorSize', () => {
  it('derives creator_size from both platforms\' follower counts', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue({ subs_followers: 40_000, youtube_subscribers: 20_000 } as any)
    vi.mocked(prisma.content_creators.update).mockResolvedValue({} as any)
    await recomputeCreatorSize('user-1')
    expect(prisma.content_creators.update).toHaveBeenCalledWith({
      where: { clerk_user_id: 'user-1' },
      data: { creator_size: 'mid' }, // 60k total → mid (>= 50k)
    })
  })
})
