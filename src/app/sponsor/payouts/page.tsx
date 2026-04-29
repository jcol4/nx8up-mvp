import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../_components/dashboard/SponsorHeader'
import { getPayoutLedger, type LedgerRow } from './_data'

const PAYOUT_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  paid: {
    label: 'Paid',
    className: 'border border-[#22c55e]/30 bg-[#22c55e]/15 text-[#4ade80]',
  },
  processing: {
    label: 'Processing',
    className: 'border border-[#99f7ff]/30 bg-[#99f7ff]/10 text-[#99f7ff]',
  },
  payout_failed: {
    label: 'Payout Failed',
    className: 'border border-[#f87171]/30 bg-[#f87171]/15 text-[#f87171]',
  },
}

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  pending:            'Awaiting',
  submitted:          'Submitted',
  admin_rejected:     'Under Review',
  admin_verified:     'Pending Approval',
  approved:           'Approved',
  revision_requested: 'Revision Req.',
}

function PayoutStatusPill({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-[#94a3b8]">
        Pending
      </span>
    )
  }
  const style = PAYOUT_STATUS_STYLES[status]
  if (!style) {
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-[#94a3b8]">
        {status}
      </span>
    )
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${style.className}`}>
      {style.label}
    </span>
  )
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

  // Group by campaign
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

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="mx-auto max-w-5xl">
          {/* Page header */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Payouts</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Payout Ledger</h1>
              <p className="mt-1 text-sm text-[#a9abb5]">
                Creator payouts across all your campaigns.
              </p>
            </div>
            {rows.length > 0 && (
              <a
                href="/api/sponsor/payouts/export"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm text-[#a9abb5] transition-colors hover:border-[#99f7ff]/35 hover:text-[#e8f4ff]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </a>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="dash-panel dash-panel--nx-top rounded-xl p-8 text-center text-[#a9abb5]">
              <p className="mb-2 text-[#e8f4ff]">No payout data yet.</p>
              <p className="text-xs leading-relaxed">
                Payouts appear here once creators submit content on your launched campaigns.
              </p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="dash-panel dash-panel--nx-top rounded-xl p-4">
                  <p className="mb-1 text-xs text-[#a9abb5]">Total Creators</p>
                  <p className="text-2xl font-bold text-[#e8f4ff]">{rows.length}</p>
                </div>
                <div className="dash-panel dash-panel--nx-top rounded-xl p-4">
                  <p className="mb-1 text-xs text-[#a9abb5]">Campaigns</p>
                  <p className="text-2xl font-bold text-[#e8f4ff]">{Object.keys(grouped).length}</p>
                </div>
                <div className="dash-panel dash-panel--nx-top rounded-xl p-4">
                  <p className="mb-1 text-xs text-[#a9abb5]">Paid Out</p>
                  <p className="text-2xl font-bold text-[#22c55e]">${totalPaid.toLocaleString()}</p>
                  <p className="mt-0.5 text-xs text-[#a9abb5]">{paidCount} creator{paidCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="dash-panel dash-panel--nx-top rounded-xl p-4">
                  <p className="mb-1 text-xs text-[#a9abb5]">Pending Payouts</p>
                  <p className="text-2xl font-bold text-[#eab308]">${totalPending.toLocaleString()}</p>
                  <p className="mt-0.5 text-xs text-[#a9abb5]">{pendingCount} creator{pendingCount !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Ledger table — one section per campaign */}
              <div className="space-y-6">
                {Object.entries(grouped).map(([campaignId, group]) => (
                  <div key={campaignId} className="dash-panel dash-panel--nx-top rounded-xl p-4 sm:p-5">
                    <h2 className="mb-3 flex items-center gap-2 font-headline text-base font-semibold text-[#e8f4ff]">
                      {group.title}
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal text-[#a9abb5]">
                        {group.rows.length} creator{group.rows.length !== 1 ? 's' : ''}
                      </span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 bg-black/25 text-[11px] uppercase tracking-[0.15em] text-[#8f97ab]">
                            <th className="text-left px-4 py-3 font-medium">Creator</th>
                            <th className="text-left px-4 py-3 font-medium">Platform</th>
                            <th className="text-left px-4 py-3 font-medium">Submission</th>
                            <th className="text-right px-4 py-3 font-medium">Amount</th>
                            <th className="text-left px-4 py-3 font-medium">Payout</th>
                            <th className="text-left px-4 py-3 font-medium">Transfer ID</th>
                            <th className="text-right px-4 py-3 font-medium">Clicks</th>
                            <th className="text-left px-4 py-3 font-medium">Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map((row) => (
                            <tr
                              key={row.applicationId}
                              className="border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.03]"
                            >
                              <td className="px-4 py-3 font-medium whitespace-nowrap text-[#e8f4ff]">
                                {row.creatorHandle}
                              </td>
                              <td className="px-4 py-3 text-xs whitespace-nowrap">
                                <span className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-1.5 py-0.5 text-[#99f7ff]">
                                  {row.platform}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-xs text-[#a9abb5]">
                                  {SUBMISSION_STATUS_LABELS[row.submissionStatus] ?? row.submissionStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {row.payoutAmount != null ? (
                                  <span className="text-[#22c55e] font-semibold">
                                    ${row.payoutAmount.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-[#a9abb5]">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <PayoutStatusPill status={row.payoutStatus} />
                              </td>
                              <td className="px-4 py-3 text-xs font-mono whitespace-nowrap text-[#8f97ab]">
                                {row.stripeTransferId ? (
                                  <span title={row.stripeTransferId}>
                                    {row.stripeTransferId.slice(0, 16)}…
                                  </span>
                                ) : (
                                  <span>—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap text-[#a9abb5]">
                                {row.linkClicks.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-xs whitespace-nowrap text-[#a9abb5]">
                                {row.updatedAt
                                  ? new Date(row.updatedAt).toLocaleDateString()
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
