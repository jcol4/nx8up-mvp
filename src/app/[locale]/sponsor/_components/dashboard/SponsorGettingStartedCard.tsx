import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CheckCircle2, Circle } from 'lucide-react'
import type { SponsorGettingStartedData } from '@/lib/sponsor-dashboard-cache'

type Props = SponsorGettingStartedData

export default function SponsorGettingStartedCard({
  profileComplete,
  hasCampaign,
  hasApplications,
  hasPaidApplication,
}: Props) {
  const t = useTranslations('sponsor.dashboard')
  const items = [
    {
      label: t('gsProfile'),
      done: profileComplete,
      href: '/sponsor/profile',
    },
    {
      label: t('gsCampaign'),
      done: hasCampaign,
      href: '/sponsor/campaigns/new',
    },
    {
      label: t('gsReview'),
      done: hasApplications,
      href: '/sponsor/creators',
    },
    {
      label: t('gsPayment'),
      done: hasPaidApplication,
      href: '/sponsor/payouts',
    },
  ]
  const doneCount = items.filter((i) => i.done).length
  if (doneCount === items.length) return null

  return (
    <div className="rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/30 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">{t('gettingStarted')}</p>
          <p className="mt-1 text-sm text-[#a9abb5]">{t('gettingStartedProgress', { done: doneCount, total: items.length })}</p>
        </div>
        <Link
          href="/sponsor/guide"
          className="shrink-0 rounded-lg border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-3 py-1.5 text-nx-11 uppercase tracking-widest text-[#99f7ff] transition hover:bg-[#99f7ff]/20"
        >
          {t('fullGuide')}
        </Link>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-[#99f7ff] to-[#22c55e]"
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>

      <ul className="mt-4 space-y-1">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/5"
            >
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22c55e]" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-white/55" />
              )}
              <span className={`text-sm ${item.done ? 'text-slate-500 line-through' : 'text-white'}`}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
