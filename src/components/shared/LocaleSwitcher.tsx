'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useTransition, useState, useRef, useEffect } from 'react'
import { updateUserLocale } from '@/app/[locale]/_actions/locale'

const LOCALES = [
  { code: 'en', label: 'English', flag: '🇺🇸', short: 'EN' },
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷', short: 'PT' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', short: 'FR' },
] as const

type Props = {
  collapsed?: boolean
}

export default function LocaleSwitcher({ collapsed = false }: Props) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(code: string) {
    setOpen(false)
    startTransition(async () => {
      await updateUserLocale(code)
      router.replace(pathname, { locale: code })
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-nx-10 uppercase tracking-widest text-white/60 transition hover:bg-white/5 hover:text-white/90"
        aria-label="Switch language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span
          className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
            collapsed ? 'max-w-0 -translate-x-1 opacity-0' : 'max-w-32 translate-x-0 opacity-100'
          }`}
        >
          {current.short}
        </span>
      </button>

      {open && !collapsed && (
        <div className="absolute bottom-full left-0 mb-1 w-40 rounded-lg border border-white/10 bg-[#0a1223] py-1 shadow-xl">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelect(l.code)}
              disabled={l.code === locale || isPending}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-nx-10 uppercase tracking-wide transition hover:bg-white/5 ${
                l.code === locale
                  ? 'text-[#00c8ff]'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
