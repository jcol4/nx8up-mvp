/**
 * @file layout.tsx
 * @description Root application layout for the nx8up Next.js App Router project.
 *
 * Responsibilities:
 * - Wraps the entire app in ClerkProvider with a custom dark/branded theme matching
 *   the nx8up design system (cyan accent #00c8ff, dark navy background #0a1223).
 * - Loads the user's role from Clerk session claims (set server-side via Clerk metadata)
 *   and display info (display name, username, avatar) to pass to the site header.
 * - Renders ConditionalHeader, which hides itself on certain routes (e.g. onboarding).
 * - Configures global metadata including Open Graph image and favicon.
 *
 * Environment variables:
 * - NEXT_PUBLIC_APP_URL — canonical base URL used for metadataBase; falls back to
 *   http://localhost:3000 in development.
 *
 * External services: Clerk (authentication + session claims)
 *
 * Gotchas:
 * - `getUserDisplayInfo` is only called when userId is present to avoid an unnecessary
 *   server-side fetch for unauthenticated visitors.
 * - Role is read from `sessionClaims.metadata.role`; if the Clerk JWT template is not
 *   configured to expose this field the value will always be undefined.
 * - `unsafe_disableDevelopmentModeWarnings` is set to true intentionally to reduce noise
 *   in local development — remove this flag before auditing Clerk config in production.
 */
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { ConditionalHeader } from "@/components/layout";
import { getUserDisplayInfo } from "@/lib/get-user-display-info";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
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

/**
 * Root layout component rendered for every route in the application.
 *
 * Fetches the authenticated user's role and display information server-side so
 * that the header can be rendered with the correct user context without a
 * client-side data fetch.
 *
 * @param children - The page or nested layout content to render inside the shell.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
  const displayInfo =
    userId != null ? await getUserDisplayInfo() : { displayName: null, username: null, imageUrl: null };

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#00c8ff',
          colorBackground: '#0a1223',
          colorInputBackground: '#0a1223',
          colorInputText: '#c8dff0',
          colorText: '#c8dff0',
          colorTextSecondary: '#4a6080',
          borderRadius: '10px',
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
          formFieldInput: 'bg-[rgba(0,200,255,0.05)] border-[rgba(0,200,255,0.18)] text-[#c8dff0]',
          footerActionLink: 'text-[#00c8ff]',
          navbarButton: 'text-[#c8dff0]',
          userButtonPopoverCard: 'bg-[#0a1223] border border-[rgba(0,200,255,0.18)] shadow-xl',
          userButtonPopoverActionButton: 'text-white hover:bg-[rgba(0,200,255,0.08)] hover:text-[#00c8ff]',
          userButtonPopoverFooter: 'hidden',
        },
      }}
    >
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ConditionalHeader
            displayName={displayInfo.displayName}
            username={displayInfo.username}
            role={role}
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
