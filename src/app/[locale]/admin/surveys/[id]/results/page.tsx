import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Survey Results — nx8up Admin' }

type Props = { params: Promise<{ id: string }> }

const STATUS_STYLE: Record<string, string> = {
  active:
    'rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#86efac]',
  draft:
    'rounded-full border border-slate-400/35 bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-200',
  closed:
    'rounded-full border border-[#f87171]/40 bg-[#f87171]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#fca5a5]',
}

const ROLE_COLOR = {
  creator: '#d8b4fe',
  sponsor: '#bffcff',
}

export default async function SurveyResultsPage({ params }: Props) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const { id } = await params

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: 'asc' } },
      responses: true,
    },
  })
  if (!survey) return notFound()

  const creatorResponses = survey.responses.filter(r => r.role === 'creator')
  const sponsorResponses = survey.responses.filter(r => r.role === 'sponsor')

  const dates = survey.responses.map(r => r.submittedAt.getTime())
  const dateFrom = dates.length ? new Date(Math.min(...dates)) : null
  const dateTo = dates.length ? new Date(Math.max(...dates)) : null

  type SurveyResponseRow = (typeof survey.responses)[number]
  type Tally = Record<string, number>

  function tally(responses: SurveyResponseRow[], questionId: string, options: string[]): Tally {
    const counts: Tally = {}
    for (const o of options) counts[o] = 0
    for (const r of responses) {
      const answers = r.answers as Record<string, string>
      const chosen = answers[questionId]
      if (chosen && counts[chosen] !== undefined) counts[chosen]++
    }
    return counts
  }

  return (
    <div className="admin-surveys admin-surveys-detail mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
      <Link
        href="/admin/surveys"
        className="inline-flex items-center gap-2 rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#bffcff] transition hover:border-[#99f7ff]/50 hover:bg-[#99f7ff]/15"
      >
        <span aria-hidden>&larr;</span>
        Back to surveys
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="cr-field-label">Survey results</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">{survey.title}</h1>
          <p className="mt-2 text-sm cr-text-muted">
            {survey.responses.length} total responses
            {dateFrom && dateTo && (
              <>
                {' · '}
                {dateFrom.toLocaleDateString()} – {dateTo.toLocaleDateString()}
              </>
            )}
          </p>
        </div>
        <span className={STATUS_STYLE[survey.status] ?? STATUS_STYLE.draft}>{survey.status}</span>
      </div>

      {survey.responses.length === 0 ? (
        <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-10 text-center">
          <p className="text-sm font-medium text-[#e8f4ff]">No responses yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {survey.questions.map(q => {
            const cTally = tally(creatorResponses, q.id, q.options)
            const sTally = tally(sponsorResponses, q.id, q.options)
            const cTotal = creatorResponses.length
            const sTotal = sponsorResponses.length

            return (
              <section
                key={q.id}
                className="dash-panel dash-panel--nx-top space-y-4 rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5 sm:p-6"
              >
                <h2 className="cr-panel-title">{q.text}</h2>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {(['creator', 'sponsor'] as const).map(r => {
                    const tallyData = r === 'creator' ? cTally : sTally
                    const total = r === 'creator' ? cTotal : sTotal
                    const color = ROLE_COLOR[r]

                    return (
                      <div key={r}>
                        <p
                          className="mb-2 text-xs font-semibold uppercase tracking-wider"
                          style={{ color }}
                        >
                          {r} ({total})
                        </p>
                        <div className="space-y-2">
                          {q.options.map(opt => {
                            const count = tallyData[opt] ?? 0
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0
                            return (
                              <div key={opt}>
                                <div className="mb-1 flex items-center justify-between text-xs">
                                  <span className="cr-text">{opt}</span>
                                  <span className="font-semibold tabular-nums text-[#e8f4ff]">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-white/5">
                                  <div
                                    className="h-2 rounded-full transition-all"
                                    style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}

          <section className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5 sm:p-6">
            <h2 className="cr-panel-title mb-4">Response summary</h2>
            <div className="overflow-x-auto">
              <table className="sp-ledger-table w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-right">Responses</th>
                    <th className="px-4 py-2 text-right">% of total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="px-4 py-2 text-[#d8b4fe]">Creators</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums text-[#e8f4ff]">
                      {creatorResponses.length}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums cr-stat-caption">
                      {survey.responses.length > 0
                        ? `${Math.round((creatorResponses.length / survey.responses.length) * 100)}%`
                        : '—'}
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="px-4 py-2 text-[#bffcff]">Sponsors</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums text-[#e8f4ff]">
                      {sponsorResponses.length}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums cr-stat-caption">
                      {survey.responses.length > 0
                        ? `${Math.round((sponsorResponses.length / survey.responses.length) * 100)}%`
                        : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold text-[#e8f4ff]">Total</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums text-[#e8f4ff]">
                      {survey.responses.length}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums cr-stat-caption">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
