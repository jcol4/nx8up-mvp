import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { routing } from '@/i18n/routing'
import { ConditionalHeader } from '@/components/layout'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  const messages = await getMessages()

  const { userId, sessionClaims } = await auth()
  const claimsMetadata = sessionClaims?.metadata as
    | { role?: string; onboardingComplete?: boolean }
    | undefined
  const role = claimsMetadata?.role
  const onboardingComplete = claimsMetadata?.onboardingComplete
  const displayInfo =
    userId != null
      ? await getUserDisplayInfo()
      : { displayName: null, username: null, imageUrl: null }

  return (
    <NextIntlClientProvider messages={messages}>
      <ConditionalHeader
        signedIn={userId != null}
        onboardingComplete={onboardingComplete}
        displayName={displayInfo.displayName}
        username={displayInfo.username}
        role={role}
      />
      {children}
    </NextIntlClientProvider>
  )
}
