import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { applyLatePenalties } from '../late-penalties'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
  prisma: {
    campaign_applications: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    content_creators: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../reputation', () => ({
  adjustCreatorReputation: vi.fn().mockResolvedValue(undefined),
  proofDeadline: vi.fn((d: Date) => {
    const r = new Date(d)
    r.setDate(r.getDate() + 7)
    return r
  }),
  LATE_PENALTY_PER_DAY: 1,
  LATE_PENALTY_CAP: 10,
}))

import { adjustCreatorReputation } from '../reputation'

const MS_PER_DAY = 86_400_000

function daysAgo(n: number) {
  return new Date(Date.now() - n * MS_PER_DAY)
}

// An accepted app whose campaign ended 10 days ago → deadline was 3 days ago
// late_penalty_applied = 0 → should charge 3 days = -3
const lateApp = {
  id: 'app-1',
  creator_id: 'creator-1',
  late_penalty_applied: 0,
  status: 'accepted',
  deal_submission: null,
  campaign: { end_date: daysAgo(10) },
}

// An app that already had 2 days charged, now 5 days past deadline → charge 3 more
const partiallyChargedApp = {
  id: 'app-2',
  creator_id: 'creator-2',
  late_penalty_applied: 2,
  status: 'accepted',
  deal_submission: null,
  campaign: { end_date: daysAgo(12) },
}

// An app that already hit the cap
const cappedApp = {
  id: 'app-3',
  creator_id: 'creator-3',
  late_penalty_applied: 10,
  status: 'accepted',
  deal_submission: null,
  campaign: { end_date: daysAgo(20) },
}

beforeEach(() => {
  vi.mocked(prisma.campaign_applications.update).mockResolvedValue({} as any)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('applyLatePenalties', () => {
  it('charges days late and updates late_penalty_applied', async () => {
    vi.mocked(prisma.campaign_applications.findMany).mockResolvedValue([lateApp] as any)

    await applyLatePenalties()

    expect(adjustCreatorReputation).toHaveBeenCalledWith('creator-1', -3)
    expect(prisma.campaign_applications.update).toHaveBeenCalledWith({
      where: { id: 'app-1' },
      data: { late_penalty_applied: 3 },
    })
  })

  it('only charges the delta since last run (not re-charges past days)', async () => {
    vi.mocked(prisma.campaign_applications.findMany).mockResolvedValue([partiallyChargedApp] as any)

    await applyLatePenalties()

    // 12 days since end_date → deadline 5 days ago → 5 days late total, 2 already charged → charge 3
    expect(adjustCreatorReputation).toHaveBeenCalledWith('creator-2', -3)
    expect(prisma.campaign_applications.update).toHaveBeenCalledWith({
      where: { id: 'app-2' },
      data: { late_penalty_applied: 5 },
    })
  })

  it('does not charge when already at cap', async () => {
    vi.mocked(prisma.campaign_applications.findMany).mockResolvedValue([cappedApp] as any)

    await applyLatePenalties()

    expect(adjustCreatorReputation).not.toHaveBeenCalled()
    expect(prisma.campaign_applications.update).not.toHaveBeenCalled()
  })

  it('caps penalty at LATE_PENALTY_CAP even if many days late', async () => {
    const veryLateApp = {
      ...lateApp,
      id: 'app-4',
      creator_id: 'creator-4',
      late_penalty_applied: 8,
      campaign: { end_date: daysAgo(30) },
    }
    vi.mocked(prisma.campaign_applications.findMany).mockResolvedValue([veryLateApp] as any)

    await applyLatePenalties()

    // 30 days since end → 23 days past deadline, already charged 8 → would charge 15, but cap is 10
    expect(adjustCreatorReputation).toHaveBeenCalledWith('creator-4', -2)
    expect(prisma.campaign_applications.update).toHaveBeenCalledWith({
      where: { id: 'app-4' },
      data: { late_penalty_applied: 10 },
    })
  })

  it('does nothing when no late applications exist', async () => {
    vi.mocked(prisma.campaign_applications.findMany).mockResolvedValue([])

    await applyLatePenalties()

    expect(adjustCreatorReputation).not.toHaveBeenCalled()
  })
})
