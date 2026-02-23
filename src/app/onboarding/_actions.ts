'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'

export const completeOnboarding = async (formData: FormData) => {
  const { isAuthenticated, userId } = await auth()

  if (!isAuthenticated) {
    return { error: 'No logged in user' }
  }
  const client = await clerkClient()

  const dob = formData.get('userDateOfBirth') as string

  if (!dob) return { error: 'Date of birth is required' }

  // Calculate age
  const birthDate = new Date(dob)
  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

  if (age < 18) return { error: 'You must be 18 or older to use this app' }

  try {
    const res = await client.users.updateUser(userId, {
      publicMetadata: { 
        onboardingComplete: true, 
        ageVerified: true 
      },
    })
    return { message: res.publicMetadata }
  } catch (err) {
    return { error: 'Failed to update user metadata' }
  }
}