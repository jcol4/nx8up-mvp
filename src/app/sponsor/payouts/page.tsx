import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../_components/dashboard/SponsorHeader'
import { getPayoutLedger, type LedgerRow } from './_data'

const PAYOUT_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  paid: {
    label: 'Paid',
    className: 'rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-2.5 py-0.5 text-xs font-semibold text-[#86efac]',
  },
  processing: {
    label: 'Processing',
    className:
      'rounded-full border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-2.5 py-0.5 text-xs font-semibold text-[#bffcff]',
  },
  payout_failed: {
    label: 'Payout failed',
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
  { label: 'Paid', swatch: 'bg-[#22c55e]' },
  { label: 'Processing', swatch: 'bg-[#99f7ff]' },
  { label: 'Pending', swatch: 'bg-slate-400' },
  { label: 'Failed', swatch: 'bg-[#f87171]' },
] as const

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  pending: 'Awaiting',
  submitted: 'Submitted',
  admin_rejected: 'Under review',
  admin_verified: 'Pending approval',
  approved: 'Approved',
  revision_requested: 'Revision req.',
}

function PayoutStatusPill({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="rounded-full border border-slate-400/35 bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold text-slate-200">
        Pending
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
  return <span className={style.className}>{style.label}</span>
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
              <p className="cr-field-label">Finance</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">
                Payout ledger
              </h1>
              <p className="mt-2 text-sm cr-text-muted">
                Creator payouts across all your campaigns.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <div className="sp-app-header-stat rounded-lg px-4 py-2.5 text-center">
                <p className="font-headline text-2xl font-semibold tabular-nums text-[#e8f4ff]">
                  {rows.length}
                </p>
                <p className="sp-app-stat-label mt-0.5">
                  Ledger row{rows.length === 1 ? '' : 's'}
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
                  Export CSV
                </a>
              )}
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-8 text-center">
              <p className="text-sm font-medium text-[#e8f4ff]">No payout data yet</p>
              <p className="mt-1 text-sm cr-text-muted">
                Payouts appear here once creators submit content on your launched campaigns.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard label="Total creators" value={rows.length} />
                <SummaryCard label="Campaigns" value={campaignCount} />
                <SummaryCard
                  label="Paid out"
                  value={`$${totalPaid.toLocaleString()}`}
                  caption={`${paidCount} creator${paidCount !== 1 ? 's' : ''}`}
                  valueClassName="text-[#4ade80]"
                />
                <SummaryCard
                  label="Pending payouts"
                  value={`$${totalPending.toLocaleString()}`}
                  caption={`${pendingCount} creator${pendingCount !== 1 ? 's' : ''}`}
                  valueClassName="text-[#fde047]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2.5">
                <span className="sp-app-stat-label w-full sm:w-auto">Payout status</span>
                {STATUS_LEGEND.map(item => (
                  <span key={item.label} className="inline-flex items-center gap-1.5 text-xs cr-stat-caption">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${item.swatch}`} />
                    {item.label}
                  </span>
                ))}
              </div>

              <div className="space-y-6">
                <p className="cr-field-label px-1">By campaign</p>
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
                        {group.rows.length} creator{group.rows.length !== 1 ? 's' : ''}
                      </span>
                    </header>
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
                      <table className="sp-ledger-table w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="px-4 py-3 text-left">Creator</th>
                            <th className="px-4 py-3 text-left">Platform</th>
                            <th className="px-4 py-3 text-left">Submission</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3 text-left">Payout</th>
                            <th className="px-4 py-3 text-left">Transfer ID</th>
                            <th className="px-4 py-3 text-right">Clicks</th>
                            <th className="px-4 py-3 text-left">Updated</th>
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
                                    {SUBMISSION_STATUS_LABELS[row.submissionStatus] ??
                                      row.submissionStatus}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                  {row.payoutAmount != null ? (
                                    <span className="font-semibold tabular-nums text-[#4ade80]">
                                      ${row.payoutAmount.toLocaleString()}
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
                                  {row.linkClicks.toLocaleString()}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-xs cr-stat-caption">
                                  {row.updatedAt
                                    ? new Date(row.updatedAt).toLocaleDateString()
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
