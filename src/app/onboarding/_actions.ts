/**
 * @file onboarding/_actions.ts
 *
 * Next.js Server Actions for the onboarding flow.
 *
 * This module runs exclusively on the server ('use server') and is the
 * single point of truth for completing user onboarding. It:
 *   1. Validates the submitted date of birth and role.
 *   2. Verifies the user is at least 18 years old.
 *   3. Creates a `content_creators` or `sponsors` record in the database
 *      (skipping creation if the record already exists to be idempotent).
 *   4. Updates the Clerk user's public metadata with
 *      { onboardingComplete: true, ageVerified: true, role }.
 *
 * External services:
 *   - Clerk (`auth`, `currentUser`, `clerkClient`) – session auth and
 *     metadata update.
 *   - Prisma ORM (`@/lib/prisma`) – writes to `content_creators` /
 *     `sponsors` tables.
 *
 * Gotchas:
 *   - Age is computed using 365.25 days/year (accounts for leap years).
 *   - The function always returns `{ error }` or `{ message }`, never throws,
 *     so callers must check both keys.
 *   - If onboarding is called a second time for an existing record the DB
 *     write is skipped, but Clerk metadata is still overwritten. This means
 *     a user could change their role by re-submitting the form if they
 *     somehow bypass the layout guard — see layout.tsx.
 */
'use server'

import { auth, clerkClient, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Server action called when the user submits the onboarding form.
 *
 * @param formData - FormData with fields:
 *   - `userDateOfBirth` (string, ISO date `YYYY-MM-DD`) – the user's DOB.
 *   - `role` (string) – must be `"creator"` or `"sponsor"`.
 *
 * @returns
 *   `{ message: Record<string, unknown> }` containing the updated Clerk
 *   public metadata (includes `role`, `onboardingComplete`, `ageVerified`)
 *   on success, or `{ error: string }` describing the failure reason.
 */
export const completeOnboarding = async (formData: FormData) => {
  const { userId } = await auth()

  if (!userId) return { error: 'No logged in user' }

  const dob = formData.get('userDateOfBirth') as string
  const role = formData.get('role') as string

  if (!dob) return { error: 'Date of birth is required' }
  if (!role || !['creator', 'sponsor'].includes(role)) {
    return { error: 'Please select a valid role' }
  }

  // Calculate age
  const birthDate = new Date(dob)
  const age = Math.floor(
    (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  )

  if (age < 18) return { error: 'You must be 18 or older to use this app' }

  try {
    const user = await currentUser()
    const email = user?.emailAddresses[0]?.emailAddress

    if (!email) return { error: 'No email address found on your account' }

    // Create database record based on role
    if (role === 'creator') {
      // Check if record already exists to avoid duplicate errors
      const existing = await prisma.content_creators.findUnique({
        where: { clerk_user_id: userId }
      })

      if (!existing) {
        await prisma.content_creators.create({
          data: {
            clerk_user_id: userId,
            email,
            age,
            audience_locations: [],
          }
        })
      }
    } else if (role === 'sponsor') {
      const existing = await prisma.sponsors.findUnique({
        where: { clerk_user_id: userId }
      })

      if (!existing) {
        await prisma.sponsors.create({
          data: {
            clerk_user_id: userId,
            email,
          }
        })
      }
    }

    // Update Clerk metadata
    const client = await clerkClient()
    const res = await client.users.updateUser(userId, {
      publicMetadata: {
        onboardingComplete: true,
        ageVerified: true,
        role,
      },
    })

    return { message: res.publicMetadata }
  } catch (err: any) {
    console.error('Onboarding error:', err)
    console.error('Onboarding error meta:', JSON.stringify(err?.meta))
    console.error('Onboarding error target:', JSON.stringify(err?.meta?.target))
    return { error: 'Failed to complete onboarding. Please try again.' }
  }
}