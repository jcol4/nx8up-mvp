/**
 * Server actions for admin review of sponsor profile change requests.
 *
 * Handles the `sponsor_age_restriction_requests` workflow, where sponsors
 * submit a request to enable or change their age restriction setting. An admin
 * must approve or deny the request before the `sponsors` table is updated.
 *
 * Exports:
 *  - `getAgeRestrictionChangeQueue`   – list view: all pending requests with
 *    sponsor info for the verification queue tab.
 *  - `getAgeRestrictionChangeRequest` – detail view: single request by ID.
 *  - `reviewAgeRestrictionRequest`    – approve or deny a pending request;
 *    atomic transaction on approval updates `sponsors` and request together.
 *
 * All exported functions call `assertAdmin()` and short-circuit on failure.
 *
 * External services: Clerk (auth), Prisma (sponsor_age_restriction_requests,
 * sponsors).
 */
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

/**
 * Throws `Error("Unauthorized")` if the current session is not an admin.
 * Called at the top of every exported action in this file.
 */
async function assertAdmin() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') throw new Error('Unauthorized')
}

/**
 * Returns all pending `sponsor_age_restriction_requests` ordered
 * oldest-first, with a minimal sponsor select for the queue list view.
 */
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

/**
 * Fetches a single `sponsor_age_restriction_requests` record by its primary
 * key, with sponsor details needed to render the detail review page.
 *
 * Returns `null` if no record with the given `id` exists.
 */
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

/**
 * Approves or denies a pending age-restriction change request.
 *
 * @param id - The `sponsor_age_restriction_requests.id` to review.
 * @param decision - `"approved"` applies the requested change to the sponsor
 *   record via an atomic `$transaction`; `"denied"` only updates the request
 *   status.
 * @param adminNotes - Optional notes stored on the request and visible to the
 *   sponsor.
 *
 * Guards:
 *  - Returns `{ error: 'Unauthorized' }` for non-admins.
 *  - Returns `{ error }` if the request is not found or is not `"pending"`
 *   (prevents double-review).
 *
 * Side effects on success:
 *  - On approval: atomically updates `sponsors.age_restricted`,
 *    `sponsors.age_restriction_type`, and `sponsors.updated_at`, and sets
 *    the request status to `"approved"`.
 *  - On denial: sets the request status to `"denied"`.
 *  - Revalidates `/admin/sponsor-profile-changes`, the specific request page,
 *    and `/sponsor/profile`.
 */
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
