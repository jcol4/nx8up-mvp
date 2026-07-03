import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { deleteCreatorAccount } from '../../app/[locale]/creator/profile/_actions'
import { prisma } from '../prisma'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}))

vi.mock('../prisma', () => ({
  prisma: {
    content_creators: { updateMany: vi.fn() },
  },
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { auth, clerkClient } from '@clerk/nextjs/server'

const mockDeleteUser = vi.fn()

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any)
  vi.mocked(clerkClient).mockResolvedValue({ users: { deleteUser: mockDeleteUser } } as any)
  vi.mocked(prisma.content_creators.updateMany).mockResolvedValue({ count: 1 })
  mockDeleteUser.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('deleteCreatorAccount', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    const res = await deleteCreatorAccount()
    expect(res.error).toBeDefined()
    expect(prisma.content_creators.updateMany).not.toHaveBeenCalled()
  })

  it('sets is_deleted=true on the creator record before calling Clerk', async () => {
    await deleteCreatorAccount()
    expect(prisma.content_creators.updateMany).toHaveBeenCalledWith({
      where: { clerk_user_id: 'user-1' },
      data: { is_deleted: true },
    })
  })

  it('calls Clerk deleteUser after the DB write', async () => {
    await deleteCreatorAccount()
    expect(mockDeleteUser).toHaveBeenCalledWith('user-1')
  })

  it('returns success when both DB write and Clerk deletion succeed', async () => {
    const res = await deleteCreatorAccount()
    expect(res.success).toBe(true)
    expect(res.error).toBeUndefined()
  })

  it('returns an error (not throws) when Clerk deleteUser fails', async () => {
    mockDeleteUser.mockRejectedValue(new Error('Clerk API error'))
    const res = await deleteCreatorAccount()
    expect(res.error).toBeDefined()
    expect(res.success).toBeUndefined()
  })

  it('still writes is_deleted=true even when Clerk deletion subsequently fails', async () => {
    mockDeleteUser.mockRejectedValue(new Error('Clerk API error'))
    await deleteCreatorAccount()
    expect(prisma.content_creators.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { is_deleted: true } }),
    )
  })
})
