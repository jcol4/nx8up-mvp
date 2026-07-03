'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CheckCircle2, Megaphone } from 'lucide-react'
import { DashboardPanel } from '@/components/dashboard'

export default function SponsorPostCampaignSection() {
  const t = useTranslations('sponsor.dashboard')
  const CHECKLIST = [t('checklistBudget'), t('checklistPlatforms'), t('checklistAudience')]
  return (
    <DashboardPanel
      title={t('postCampaignTitle')}
      titleClassName="text-lg sm:text-xl md:text-2xl tracking-[0.2em]"
      className="relative !overflow-hidden !rounded-2xl !bg-gradient-to-br !from-[#0d1522] !via-[#0a0f18] !to-[#0f1624] !p-7 backdrop-blur-xl sm:!p-9 md:!p-10 border-white/20 shadow-[0_28px_64px_-24px_rgba(0,0,0,0.55),0_0_0_1px_rgba(153,247,255,0.14),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-[#99f7ff]/25 md:min-h-[15rem]"
    >
      {/* Ambient depth — soft color pools behind content */}
      <div
        className="pointer-events-none absolute -right-24 -top-32 h-[22rem] w-[22rem] rounded-full bg-[#99f7ff]/[0.14] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-20 h-[18rem] w-[18rem] rounded-full bg-[#99f7ff]/[0.14] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#99f7ff]/35 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-10">
        <div className="relative">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#99f7ff]/35 bg-[#99f7ff]/10 shadow-[0_0_24px_-8px_rgba(153,247,255,0.45)]">
              <Megaphone className="h-6 w-6 text-[#bffcff]" aria-hidden />
            </div>
            <p className="min-w-0 max-w-2xl pt-0.5 text-base leading-relaxed text-white">
              {t('postCampaignDesc')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/sponsor/campaigns/new"
              className="inline-flex rounded-lg bg-gradient-to-r from-[#5ee9ff] via-[#00c8ff] to-[#22d3ee] px-6 py-3 text-sm font-semibold text-[#0a1628] shadow-[0_10px_28px_-6px_rgba(0,200,255,0.55),inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:brightness-110 hover:shadow-[0_12px_32px_-4px_rgba(0,200,255,0.6)]"
            >
              {t('postCampaignBtn')}
            </Link>
            <Link
              href="/sponsor/campaigns"
              className="inline-flex rounded-lg border border-white/25 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm transition hover:border-[#99f7ff]/50 hover:bg-[#99f7ff]/12 hover:text-[#bffcff] hover:shadow-[0_0_20px_-8px_rgba(153,247,255,0.25)]"
            >
              {t('manageCampaignsBtn')}
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-[#99f7ff]/25 bg-gradient-to-br from-[#99f7ff]/[0.1] via-black/50 to-[#99f7ff]/[0.08] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_40px_-16px_rgba(0,0,0,0.5)]">
          <div className="rounded-[10px] bg-[#070b12]/80 p-4 backdrop-blur-md sm:p-5">
            <p className="text-nx-10 font-semibold uppercase tracking-[0.22em] text-[#bffcff]">{t('campaignChecklist')}</p>
            <ul className="mt-4 space-y-2.5">
              {CHECKLIST.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-[#99f7ff]/25 hover:bg-white/[0.07]"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#99f7ff]" aria-hidden />
                  <span className="text-sm leading-snug text-white/95">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardPanel>
  )
}
