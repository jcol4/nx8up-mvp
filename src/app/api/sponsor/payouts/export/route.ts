/**
 * GET /api/sponsor/payouts/export
 *
 * Streams the sponsor's full payout ledger as a downloadable CSV file.
 * Filename is derived from the sponsor's company name and today's date
 * (e.g. "acme-corp-payouts-2026-04-20.csv").
 *
 * Returns: CSV file with Content-Disposition: attachment header.
 */
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPayoutLedger, type LedgerRow } from '@/app/sponsor/payouts/_data'

/** RFC 4180-compliant CSV escape: wraps values in double-quotes if they contain commas, quotes, or newlines. */
function csvEscape(value: string | null | undefined): string {
  if (value == null) return ''
  const s = String(value)
  // Wrap in double-quotes if the value contains a comma, double-quote, or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** Converts ledger rows into a RFC 4180 CSV string with a fixed header row. */
function buildCsv(rows: LedgerRow[]): string {
  const headers = [
    'Campaign',
    'Creator',
    'Platform',
    'Submission Status',
    'Payout Status',
    'Payout Amount (USD)',
    'Stripe Transfer ID',
    'Link Clicks',
    'Submitted At',
    'Last Updated',
  ]

  const dataRows = rows.map((r) => [
    csvEscape(r.campaignTitle),
    csvEscape(r.creatorHandle),
    csvEscape(r.platform),
    csvEscape(r.submissionStatus),
    csvEscape(r.payoutStatus ?? 'pending'),
    r.payoutAmount != null ? String(r.payoutAmount) : '',
    csvEscape(r.stripeTransferId),
    String(r.linkClicks),
    r.submittedAt ? r.submittedAt.toISOString() : '',
    r.updatedAt ? r.updatedAt.toISOString() : '',
  ])

  return [headers.join(','), ...dataRows.map((cols) => cols.join(','))].join('\r\n')
}

/** Generates and returns the sponsor's payout ledger as a downloadable CSV. */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, company_name: true },
  })
  if (!sponsor) return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })

  const rows = await getPayoutLedger(sponsor.id)
  const csv = buildCsv(rows)

  const date = new Date().toISOString().slice(0, 10)
  const slug = sponsor.company_name
    ? sponsor.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : 'payouts'
  const filename = `${slug}-payouts-${date}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
