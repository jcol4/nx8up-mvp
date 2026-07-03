import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getTranslations, getFormatter } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../_components/dashboard/SponsorHeader'
import { getPayoutLedger, type LedgerRow } from './_data'

const PAYOUT_STATUS_STYLES: Record<string, { labelKey: string; className: string }> = {
  paid: {
    labelKey: 'statusPaid',
    className: 'rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-2.5 py-0.5 text-xs font-semibold text-[#86efac]',
  },
  processing: {
    labelKey: 'statusProcessing',
    className:
      'rounded-full border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-2.5 py-0.5 text-xs font-semibold text-[#bffcff]',
  },
  payout_failed: {
    labelKey: 'statusPayoutFailed',
    className:
      'rounded-full border border-[#f87171]/40 bg-[#f87171]/15 px-2.5 py-0.5 text-xs font-semibold text-[#fca5a5]',
  },
}

const PAYOUT_ROW_TINT: Record<string, string> = {
  paid: 'bg-[#22c55e]/6',
  processing: 'bg-[#99f7ff]/5',
  payout_failed: 'bg-[#f87171]/8',
}

const STATUS_LEGEND = [
  { key: 'statusPaid', swatch: 'bg-[#22c55e]' },
  { key: 'statusProcessing', swatch: 'bg-[#99f7ff]' },
  { key: 'statusPending', swatch: 'bg-slate-400' },
  { key: 'statusFailed', swatch: 'bg-[#f87171]' },
] as const

const SUBMISSION_STATUS_KEY: Record<string, string> = {
  pending: 'subAwaiting',
  submitted: 'subSubmitted',
  admin_rejected: 'subUnderReview',
  admin_verified: 'subPendingApproval',
  approved: 'subApproved',
  revision_requested: 'subRevisionReq',
}

function summarise(rows: LedgerRow[]) {
  let totalPaid = 0
  let totalPending = 0
  let paidCount = 0
  let pendingCount = 0

  for (const r of rows) {
    const amount = r.payoutAmount ?? 0
    if (r.payoutStatus === 'paid') {
      totalPaid += amount
      paidCount++
    } else {
      totalPending += amount
      pendingCount++
    }
  }

  return { totalPaid, totalPending, paidCount, pendingCount }
}

function SummaryCard({
  label,
  value,
  caption,
  valueClassName = 'text-[#e8f4ff]',
}: {
  label: string
  value: React.ReactNode
  caption?: string
  valueClassName?: string
}) {
  return (
    <div className="sp-app-stat-panel rounded-xl p-4">
      <p className="sp-app-stat-label">{label}</p>
      <p className={`mt-1 font-headline text-2xl font-semibold tabular-nums ${valueClassName}`}>
        {value}
      </p>
      {caption ? <p className="mt-0.5 text-xs cr-stat-caption">{caption}</p> : null}
    </div>
  )
}

export default async function SponsorPayoutsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const t = await getTranslations('sponsor.payouts')
  const format = await getFormatter()
  const PayoutStatusPill = ({ status }: { status: string | null }) => {
    if (!status) {
      return (
        <span className="rounded-full border border-slate-400/35 bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold text-slate-200">
          {t('statusPending')}
        </span>
      )
    }
    const style = PAYOUT_STATUS_STYLES[status]
    if (!style) {
      return (
        <span className="rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 text-xs font-semibold cr-text-muted">
          {status}
        </span>
      )
    }
    return <span className={style.className}>{t(style.labelKey)}</span>
  }

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, company_name: true },
  })
  if (!sponsor) redirect('/')

  const rows = await getPayoutLedger(sponsor.id)
  const { totalPaid, totalPending, paidCount, pendingCount } = summarise(rows)

  const grouped = rows.reduce<Record<string, { title: string; rows: LedgerRow[] }>>(
    (acc, row) => {
      if (!acc[row.campaignId]) {
        acc[row.campaignId] = { title: row.campaignTitle, rows: [] }
      }
      acc[row.campaignId].rows.push(row)
      return acc
    },
    {},
  )

  const campaignCount = Object.keys(grouped).length

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="sponsor-payouts sponsor-payouts-detail mx-auto max-w-5xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="cr-field-label">{t('finance')}</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">
                {t('title')}
              </h1>
              <p className="mt-2 text-sm cr-text-muted">
                {t('subtitle')}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <div className="sp-app-header-stat rounded-lg px-4 py-2.5 text-center">
                <p className="font-headline text-2xl font-semibold tabular-nums text-[#e8f4ff]">
                  {rows.length}
                </p>
                <p className="sp-app-stat-label mt-0.5">
                  {t('ledgerRows', { n: rows.length })}
                </p>
              </div>
              {rows.length > 0 && (
                <a
                  href="/api/sponsor/payouts/export"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-4 py-2 text-sm font-semibold text-[#bffcff] transition-colors hover:border-[#99f7ff]/50 hover:bg-[#99f7ff]/15"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  {t('exportCsv')}
                </a>
              )}
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-8 text-center">
              <p className="text-sm font-medium text-[#e8f4ff]">{t('emptyTitle')}</p>
              <p className="mt-1 text-sm cr-text-muted">
                {t('emptyDesc')}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard label={t('totalCreators')} value={rows.length} />
                <SummaryCard label={t('campaigns')} value={campaignCount} />
                <SummaryCard
                  label={t('paidOut')}
                  value={`$${format.number(totalPaid)}`}
                  caption={t('creatorCount', { n: paidCount })}
                  valueClassName="text-[#4ade80]"
                />
                <SummaryCard
                  label={t('pendingPayouts')}
                  value={`$${format.number(totalPending)}`}
                  caption={t('creatorCount', { n: pendingCount })}
                  valueClassName="text-[#fde047]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2.5">
                <span className="sp-app-stat-label w-full sm:w-auto">{t('payoutStatusLabel')}</span>
                {STATUS_LEGEND.map(item => (
                  <span key={item.key} className="inline-flex items-center gap-1.5 text-xs cr-stat-caption">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${item.swatch}`} />
                    {t(item.key)}
                  </span>
                ))}
              </div>

              <div className="space-y-6">
                <p className="cr-field-label px-1">{t('byCampaign')}</p>
                {Object.entries(grouped).map(([campaignId, group]) => (
                  <section
                    key={campaignId}
                    className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-4 sm:p-5"
                  >
                    <header className="mb-4 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
                      <h2 className="font-headline text-base font-semibold text-[#e8f4ff] sm:text-lg">
                        {group.title}
                      </h2>
                      <span className="rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2.5 py-0.5 text-xs font-medium text-[#bffcff]">
                        {t('creatorCount', { n: group.rows.length })}
                      </span>
                    </header>
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
                      <table className="sp-ledger-table w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="px-4 py-3 text-left">{t('thCreator')}</th>
                            <th className="px-4 py-3 text-left">{t('thPlatform')}</th>
                            <th className="px-4 py-3 text-left">{t('thSubmission')}</th>
                            <th className="px-4 py-3 text-right">{t('thAmount')}</th>
                            <th className="px-4 py-3 text-left">{t('thPayout')}</th>
                            <th className="px-4 py-3 text-left">{t('thTransferId')}</th>
                            <th className="px-4 py-3 text-right">{t('thClicks')}</th>
                            <th className="px-4 py-3 text-left">{t('thUpdated')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map(row => {
                            const rowTint =
                              (row.payoutStatus && PAYOUT_ROW_TINT[row.payoutStatus]) || ''
                            return (
                              <tr
                                key={row.applicationId}
                                className={`border-b border-white/5 last:border-0 ${rowTint}`}
                              >
                                <td className="whitespace-nowrap px-4 py-3 font-medium text-[#e8f4ff]">
                                  {row.creatorHandle}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-xs">
                                  <span className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-1.5 py-0.5 text-[#99f7ff]">
                                    {row.platform}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                  <span className="text-xs cr-stat-caption">
                                    {SUBMISSION_STATUS_KEY[row.submissionStatus]
                                      ? t(SUBMISSION_STATUS_KEY[row.submissionStatus])
                                      : row.submissionStatus}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                  {row.payoutAmount != null ? (
                                    <span className="font-semibold tabular-nums text-[#4ade80]">
                                      ${format.number(row.payoutAmount)}
                                    </span>
                                  ) : (
                                    <span className="cr-stat-caption">—</span>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">
                                  <PayoutStatusPill status={row.payoutStatus} />
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs cr-stat-caption">
                                  {row.stripeTransferId ? (
                                    <span title={row.stripeTransferId}>
                                      {row.stripeTransferId.slice(0, 16)}…
                                    </span>
                                  ) : (
                                    <span>—</span>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums cr-text">
                                  {format.number(row.linkClicks)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-xs cr-stat-caption">
                                  {row.updatedAt
                                    ? format.dateTime(new Date(row.updatedAt), 'numeric')
                                    : '—'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
