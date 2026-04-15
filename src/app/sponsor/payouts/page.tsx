import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../SponsorHeader'
import { getPayoutLedger, type LedgerRow } from './_data'

const PAYOUT_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  paid:          { label: 'Paid',           className: 'bg-[#22c55e]/20 text-[#22c55e]' },
  processing:    { label: 'Processing',     className: 'bg-[#00c8ff]/20 text-[#00c8ff]' },
  payout_failed: { label: 'Payout Failed',  className: 'bg-[#f87171]/20 text-[#f87171]' },
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
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {/* Page header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold dash-text-bright mb-1">Payout Ledger</h1>
              <p className="dash-text-muted text-sm">
                Creator payouts across all your campaigns.
              </p>
            </div>
            {rows.length > 0 && (
              <a
                href="/api/sponsor/payouts/export"
                className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-white/5 border border-white/10 text-sm dash-text hover:border-[rgba(0,200,255,0.3)] hover:dash-text-bright transition-colors"
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
            <div className="dash-panel p-8 text-center dash-text-muted">
              <p className="mb-2">No payout data yet.</p>
              <p className="text-xs">
                Payouts appear here once creators submit content on your launched campaigns.
              </p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="dash-panel p-4">
                  <p className="text-xs dash-text-muted mb-1">Total Creators</p>
                  <p className="text-2xl font-bold dash-text-bright">{rows.length}</p>
                </div>
                <div className="dash-panel p-4">
                  <p className="text-xs dash-text-muted mb-1">Campaigns</p>
                  <p className="text-2xl font-bold dash-text-bright">{Object.keys(grouped).length}</p>
                </div>
                <div className="dash-panel p-4">
                  <p className="text-xs dash-text-muted mb-1">Paid Out</p>
                  <p className="text-2xl font-bold text-[#22c55e]">${totalPaid.toLocaleString()}</p>
                  <p className="text-xs dash-text-muted mt-0.5">{paidCount} creator{paidCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="dash-panel p-4">
                  <p className="text-xs dash-text-muted mb-1">Pending Payouts</p>
                  <p className="text-2xl font-bold text-[#eab308]">${totalPending.toLocaleString()}</p>
                  <p className="text-xs dash-text-muted mt-0.5">{pendingCount} creator{pendingCount !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Ledger table — one section per campaign */}
              <div className="space-y-6">
                {Object.entries(grouped).map(([campaignId, group]) => (
                  <div key={campaignId}>
                    <h2 className="text-sm font-semibold dash-text-bright mb-2 flex items-center gap-2">
                      {group.title}
                      <span className="text-xs font-normal dash-text-muted">
                        {group.rows.length} creator{group.rows.length !== 1 ? 's' : ''}
                      </span>
                    </h2>
                    <div className="dash-panel overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-xs dash-text-muted uppercase tracking-wide">
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
                              className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="px-4 py-3 dash-text-bright font-medium whitespace-nowrap">
                                {row.creatorHandle}
                              </td>
                              <td className="px-4 py-3 dash-text-muted text-xs whitespace-nowrap">
                                {row.platform}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-xs dash-text-muted">
                                  {SUBMISSION_STATUS_LABELS[row.submissionStatus] ?? row.submissionStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {row.payoutAmount != null ? (
                                  <span className="text-[#22c55e] font-semibold">
                                    ${row.payoutAmount.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="dash-text-muted">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <PayoutStatusPill status={row.payoutStatus} />
                              </td>
                              <td className="px-4 py-3 text-xs font-mono dash-text-muted whitespace-nowrap">
                                {row.stripeTransferId ? (
                                  <span title={row.stripeTransferId}>
                                    {row.stripeTransferId.slice(0, 16)}…
                                  </span>
                                ) : (
                                  <span>—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right dash-text-muted whitespace-nowrap">
                                {row.linkClicks.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-xs dash-text-muted whitespace-nowrap">
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
