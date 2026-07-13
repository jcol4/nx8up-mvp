import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { ClerkProvider } from '@clerk/nextjs'
import { enUS, ptBR, frFR, esMX } from '@clerk/localizations'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  title: 'nx8up',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    images: ['/nx8up_logo_transparent.png'],
  },
}

const clerkLocaleMap = { en: enUS, 'pt-BR': ptBR, fr: frFR, 'es-419': esMX }

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'en'
  const clerkLocalization =
    clerkLocaleMap[locale as keyof typeof clerkLocaleMap] ?? enUS

  return (
    <ClerkProvider
      localization={clerkLocalization}
      appearance={{
        variables: {
          colorPrimary: '#00c8ff',
          colorBackground: '#0a1223',
          colorInputBackground: '#0a1223',
          colorInputText: '#c8dff0',
          colorText: '#c8dff0',
          colorTextSecondary: '#4a6080',
          borderRadius: '10px',
          fontSize: '1rem',
        },
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
        elements: {
          card: 'shadow-xl border border-[rgba(0,200,255,0.18)]',
          cardBox: 'bg-[#0a1223]',
          headerTitle: 'text-[#e8f4ff]',
          headerSubtitle: 'text-[#4a6080]',
          formFieldLabel: 'text-[#4a6080]',
          formFieldInput:
            'bg-[rgba(0,200,255,0.05)] border-[rgba(0,200,255,0.18)] text-[#c8dff0]',
          footerActionLink: 'text-[#00c8ff]',
          navbarButton: 'text-[#c8dff0]',
          userButtonPopoverCard:
            'bg-[#0a1223] border border-[rgba(0,200,255,0.18)] shadow-xl',
          userButtonPopoverActionButton:
            'text-white hover:bg-[rgba(0,200,255,0.08)] hover:text-[#00c8ff]',
          userButtonPopoverFooter: 'hidden',
        },
      }}
    >
      <html lang={locale}>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
