'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type Step = { title: string; body: string }
type Section = { id: string; label: string; title: string; intro: string; steps: Step[] }

export default function SponsorGuideContent() {
  const t = useTranslations('sponsor.guide')
  const SECTIONS: Section[] = [
    {
      id: 'overview',
      label: t('tabOverview'),
      title: t('overviewTitle'),
      intro: t('overviewIntro'),
      steps: [
        { title: t('overviewS1Title'), body: t('overviewS1Text') },
        { title: t('overviewS2Title'), body: t('overviewS2Text') },
        { title: t('overviewS3Title'), body: t('overviewS3Text') },
      ],
    },
    {
      id: 'profile',
      label: t('tabProfile'),
      title: t('profileTitle'),
      intro: t('profileIntro'),
      steps: [
        { title: t('profileS1Title'), body: t('profileS1Text') },
        { title: t('profileS2Title'), body: t('profileS2Text') },
        { title: t('profileS3Title'), body: t('profileS3Text') },
        { title: t('profileS4Title'), body: t('profileS4Text') },
        { title: t('profileS5Title'), body: t('profileS5Text') },
      ],
    },
    {
      id: 'campaigns',
      label: t('tabCampaigns'),
      title: t('campaignsTitle'),
      intro: t('campaignsIntro'),
      steps: [
        { title: t('campaignsS1Title'), body: t('campaignsS1Text') },
        { title: t('campaignsS2Title'), body: t('campaignsS2Text') },
        { title: t('campaignsS3Title'), body: t('campaignsS3Text') },
        { title: t('campaignsS4Title'), body: t('campaignsS4Text') },
      ],
    },
    {
      id: 'creators',
      label: t('tabCreators'),
      title: t('creatorsTitle'),
      intro: t('creatorsIntro'),
      steps: [
        { title: t('creatorsS1Title'), body: t('creatorsS1Text') },
        { title: t('creatorsS2Title'), body: t('creatorsS2Text') },
        { title: t('creatorsS3Title'), body: t('creatorsS3Text') },
        { title: t('creatorsS4Title'), body: t('creatorsS4Text') },
      ],
    },
    {
      id: 'applications',
      label: t('tabApplications'),
      title: t('applicationsTitle'),
      intro: t('applicationsIntro'),
      steps: [
        { title: t('applicationsS1Title'), body: t('applicationsS1Text') },
        { title: t('applicationsS2Title'), body: t('applicationsS2Text') },
        { title: t('applicationsS3Title'), body: t('applicationsS3Text') },
        { title: t('applicationsS4Title'), body: t('applicationsS4Text') },
      ],
    },
    {
      id: 'deal-room',
      label: t('tabDealRoom'),
      title: t('dealRoomTitle'),
      intro: t('dealRoomIntro'),
      steps: [
        { title: t('dealRoomS1Title'), body: t('dealRoomS1Text') },
        { title: t('dealRoomS2Title'), body: t('dealRoomS2Text') },
        { title: t('dealRoomS3Title'), body: t('dealRoomS3Text') },
      ],
    },
    {
      id: 'payments',
      label: t('tabPayments'),
      title: t('paymentsTitle'),
      intro: t('paymentsIntro'),
      steps: [
        { title: t('paymentsS1Title'), body: t('paymentsS1Text') },
        { title: t('paymentsS2Title'), body: t('paymentsS2Text') },
        { title: t('paymentsS3Title'), body: t('paymentsS3Text') },
        { title: t('paymentsS4Title'), body: t('paymentsS4Text') },
        { title: t('paymentsS5Title'), body: t('paymentsS5Text') },
      ],
    },
  ]
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const active = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0]

  return (
    <div className="flex gap-6">
      {/* Tab sidebar */}
      <nav className="w-48 shrink-0">
        <ul className="space-y-1">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => setActiveId(section.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  section.id === activeId
                    ? 'bg-[#99f7ff]/10 text-[#bffcff] border border-[#99f7ff]/40'
                    : 'cr-guide-nav-inactive hover:bg-white/5 border border-transparent'
                }`}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content area */}
      <div className="min-w-0 flex-1">
        <div className="rounded-xl border border-white/10 bg-black/20 p-6 sm:p-7">
          <p className="cr-field-label mb-1">{active.label}</p>
          <h2 className="font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">{active.title}</h2>
          <p className="mt-3 text-sm leading-relaxed cr-text">{active.intro}</p>

          <div className="mt-6 space-y-4">
            {active.steps.map((step, i) => (
              <div key={step.title} className="cr-guide-step-card rounded-lg border p-4 sm:p-5">
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#99f7ff]/40 bg-[#99f7ff]/10 text-nx-10 font-bold text-[#99f7ff]">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-[#e8f4ff] sm:text-base">{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed cr-text-muted sm:pl-9">{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          {SECTIONS.findIndex((s) => s.id === activeId) > 0 && (
            <button
              type="button"
              onClick={() => {
                const idx = SECTIONS.findIndex((s) => s.id === activeId)
                setActiveId(SECTIONS[idx - 1].id)
              }}
              className="text-sm cr-text-muted transition hover:text-[#99f7ff]"
            >
              {t('prev')}
            </button>
          )}
          {SECTIONS.findIndex((s) => s.id === activeId) < SECTIONS.length - 1 && (
            <button
              type="button"
              onClick={() => {
                const idx = SECTIONS.findIndex((s) => s.id === activeId)
                setActiveId(SECTIONS[idx + 1].id)
              }}
              className="ml-auto text-sm cr-text-muted transition hover:text-[#99f7ff]"
            >
              {t('next')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
