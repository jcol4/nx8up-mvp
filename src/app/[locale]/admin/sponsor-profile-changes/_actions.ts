'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

async function assertAdmin() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') throw new Error('Unauthorized')
}

export async function getAgeRestrictionChangeQueue() {
  await assertAdmin()

  return prisma.sponsor_age_restriction_requests.findMany({
    where: { status: 'pending' },
    orderBy: { created_at: 'asc' },
    include: {
      sponsor: {
        select: {
          id: true,
          company_name: true,
          email: true,
          age_restricted: true,
          age_restriction_type: true,
        },
      },
    },
  })
}

export async function getAgeRestrictionChangeRequest(id: string) {
  await assertAdmin()

  return prisma.sponsor_age_restriction_requests.findUnique({
    where: { id },
    include: {
      sponsor: {
        select: {
          id: true,
          company_name: true,
          email: true,
          age_restricted: true,
          age_restriction_type: true,
        },
      },
    },
  })
}

export async function reviewAgeRestrictionRequest(
  id: string,
  decision: 'approved' | 'denied',
  adminNotes?: string,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await assertAdmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  const request = await prisma.sponsor_age_restriction_requests.findUnique({
    where: { id },
  })
  if (!request) return { error: 'Request not found.' }
  if (request.status !== 'pending') return { error: 'This request has already been reviewed.' }

  if (decision === 'approved') {
    await prisma.$transaction([
      prisma.sponsors.update({
        where: { id: request.sponsor_id },
        data: {
          age_restricted: request.requested_age_restricted,
          age_restriction_type: request.requested_age_restriction_type,
          updated_at: new Date(),
        },
      }),
      prisma.sponsor_age_restriction_requests.update({
        where: { id },
        data: { status: 'approved', admin_notes: adminNotes ?? null },
      }),
    ])
  } else {
    await prisma.sponsor_age_restriction_requests.update({
      where: { id },
      data: { status: 'denied', admin_notes: adminNotes ?? null },
    })
  }

  revalidatePath('/admin/sponsor-profile-changes')
  revalidatePath(`/admin/sponsor-profile-changes/${id}`)
  revalidatePath('/sponsor/profile')

  return { success: true }
}
