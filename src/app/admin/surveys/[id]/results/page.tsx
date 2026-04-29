import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Survey Results — nx8up Admin' }

type Props = { params: Promise<{ id: string }> }

const ROLE_COLOR = {
  creator: '#7b4fff',
  sponsor: '#00c8ff',
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
  const dateTo   = dates.length ? new Date(Math.max(...dates)) : null

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
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href="/admin/surveys" className="text-xs font-medium text-[#99f7ff] transition-colors hover:text-[#d7fbff]">
                ← Back to surveys
              </Link>
              <h1 className="mt-1 text-xl font-semibold text-[#e8f4ff]">{survey.title}</h1>
              <p className="mt-0.5 text-sm text-[#c4cad6]">
                {survey.responses.length} total responses
                {dateFrom && dateTo && (
                  <> · {dateFrom.toLocaleDateString()} – {dateTo.toLocaleDateString()}</>
                )}
              </p>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
              survey.status === 'active' ? 'bg-[#22c55e]/20 text-[#22c55e]' :
              survey.status === 'closed' ? 'bg-[#f87171]/20 text-[#f87171]' :
              'bg-[#94a3b8]/20 text-[#94a3b8]'
            }`}>
              {survey.status}
            </span>
          </div>
        </div>

        {survey.responses.length === 0 ? (
          <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center">
            <p className="text-[#c4cad6]">No responses yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {survey.questions.map(q => {
              const cTally = tally(creatorResponses, q.id, q.options)
              const sTally = tally(sponsorResponses, q.id, q.options)
              const cTotal = creatorResponses.length
              const sTotal = sponsorResponses.length

              return (
                <div key={q.id} className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5 space-y-4">
                  <p className="text-sm font-medium text-[#e8f4ff]">{q.text}</p>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {(['creator', 'sponsor'] as const).map(r => {
                      const tallyData = r === 'creator' ? cTally : sTally
                      const total = r === 'creator' ? cTotal : sTotal
                      const color = ROLE_COLOR[r]

                      return (
                        <div key={r}>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color }}>
                            {r} ({total})
                          </p>
                          <div className="space-y-2">
                            {q.options.map(opt => {
                              const count = tallyData[opt] ?? 0
                              const pct = total > 0 ? Math.round((count / total) * 100) : 0
                              return (
                                <div key={opt}>
                                  <div className="mb-1 flex items-center justify-between text-xs">
                                    <span className="text-[#c4cad6]">{opt}</span>
                                    <span className="font-medium text-[#e8f4ff]">{count} ({pct}%)</span>
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
                </div>
              )
            })}

            <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5">
              <h2 className="mb-3 text-sm font-semibold text-[#e8f4ff]">Response Summary</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-2 text-left text-xs font-medium text-[#8f97ab]">Role</th>
                    <th className="pb-2 text-right text-xs font-medium text-[#8f97ab]">Responses</th>
                    <th className="pb-2 text-right text-xs font-medium text-[#8f97ab]">% of total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-2 text-[#7b4fff]">Creators</td>
                    <td className="py-2 text-right text-[#e8f4ff]">{creatorResponses.length}</td>
                    <td className="py-2 text-right text-[#c4cad6]">
                      {survey.responses.length > 0
                        ? `${Math.round((creatorResponses.length / survey.responses.length) * 100)}%`
                        : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[#00c8ff]">Sponsors</td>
                    <td className="py-2 text-right text-[#e8f4ff]">{sponsorResponses.length}</td>
                    <td className="py-2 text-right text-[#c4cad6]">
                      {survey.responses.length > 0
                        ? `${Math.round((sponsorResponses.length / survey.responses.length) * 100)}%`
                        : '—'}
                    </td>
                  </tr>
                  <tr className="font-semibold">
                    <td className="py-2 text-[#e8f4ff]">Total</td>
                    <td className="py-2 text-right text-[#e8f4ff]">{survey.responses.length}</td>
                    <td className="py-2 text-right text-[#c4cad6]">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
