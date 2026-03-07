'use server'

import { auth, clerkClient, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

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
    return { error: 'Failed to complete onboarding. Please try again.' }
  }
}