/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  SOCIAL LINKS — TEMPLATE / PLACEHOLDER                                     ║
 * ║  Before real launch: replace each `href` below with your real URLs.            ║
 * ║  Search this repo for: SOCIAL_URL_TEMPLATE                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

type SocialTemplateLinksProps = {
  /** `sidebar` = dashboard shell; `auth` = sign-in / sign-up footer */
  variant?: 'sidebar' | 'auth'
  className?: string
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.434 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.007-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.876 19.876 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.42-2.157 2.42z" />
    </svg>
  )
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

const iconClass = 'h-[18px] w-[18px] shrink-0'

export default function SocialTemplateLinks({ variant = 'sidebar', className = '' }: SocialTemplateLinksProps) {
  const wrap =
    variant === 'sidebar'
      ? 'flex items-center justify-center gap-2 border-t border-white/8 pt-3'
      : 'flex items-center justify-center gap-3'

  const btn =
    variant === 'sidebar'
      ? 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#99f7ff]/85 shadow-[0_0_12px_rgba(153,247,255,0.06)] transition hover:border-[#99f7ff]/35 hover:bg-[#99f7ff]/10 hover:text-[#bffcff]'
      : 'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#99f7ff]/15 bg-black/25 text-[#99f7ff]/80 transition hover:border-[#99f7ff]/40 hover:bg-[#99f7ff]/10 hover:text-[#bffcff]'

  return (
    <nav aria-label="Nx8up on social" className={`${wrap} ${className}`}>
      {/* SOCIAL_URL_TEMPLATE — Discord: replace `href` with your permanent invite URL */}
      <a
        href="https://discord.gg/REPLACE_ME_NX8UP"
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Discord (opens in a new tab)"
      >
        <DiscordIcon className={iconClass} />
      </a>

      {/* SOCIAL_URL_TEMPLATE — YouTube: replace `href` with your channel or handle URL */}
      <a
        href="https://www.youtube.com/@REPLACE_ME_NX8UP"
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="YouTube (opens in a new tab)"
      >
        <YoutubeIcon className={iconClass} />
      </a>

      {/* SOCIAL_URL_TEMPLATE — Instagram: replace `href` with your profile URL */}
      <a
        href="https://www.instagram.com/REPLACE_ME_NX8UP/"
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Instagram (opens in a new tab)"
      >
        <InstagramIcon className={iconClass} />
      </a>
    </nav>
  )
}
