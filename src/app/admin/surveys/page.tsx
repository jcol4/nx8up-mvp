import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import SurveyDeleteButton from './SurveyDeleteButton'
import SurveyStatusToggle from './SurveyStatusToggle'

export const metadata = { title: 'Surveys — nx8up Admin' }

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-[#22c55e]/20 text-[#22c55e]',
  draft:  'bg-[#94a3b8]/20 text-[#94a3b8]',
  closed: 'bg-[#f87171]/20 text-[#f87171]',
}

export default async function AdminSurveysPage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const surveys = await prisma.survey.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { responses: true } },
    },
  })

  const active = surveys.filter(s => s.status === 'active').length
  const draft  = surveys.filter(s => s.status === 'draft').length
  const closed = surveys.filter(s => s.status === 'closed').length

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
          <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Surveys</h1>
          <p className="mt-1 text-sm text-[#c4cad6]">
            {surveys.length} total · {active} active · {draft} draft · {closed} closed
          </p>
        </div>
        <Link
          href="/admin/surveys/new"
          className="rounded-lg border border-[#99f7ff]/45 bg-[#99f7ff]/15 px-4 py-2 text-sm font-semibold text-[#bffcff] transition hover:border-[#99f7ff]/70 hover:bg-[#99f7ff]/22 hover:text-[#e8f4ff]"
        >
          New Survey
        </Link>
      </div>
      </div>

      {surveys.length === 0 ? (
        <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center">
          <p className="text-[#c4cad6]">No surveys yet.</p>
          <Link href="/admin/surveys/new" className="mt-3 inline-block text-sm dash-accent hover:underline">
            Create your first survey
          </Link>
        </div>
      ) : (
        <div className="glass-panel interactive-panel overflow-hidden rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/25">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Title</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Target</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Responses</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Created</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {surveys.map(survey => (
                <tr key={survey.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#e8f4ff]">{survey.title}</span>
                    {survey.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-[#a9abb5]">{survey.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[survey.status] ?? 'bg-[#94a3b8]/20 text-[#94a3b8]'}`}>
                      {survey.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-[#c4cad6]">
                      {survey.targetRoles.join(', ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#c4cad6]">{survey._count.responses}</td>
                  <td className="px-4 py-3 text-xs text-[#a9abb5]">
                    {new Date(survey.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2.5">
                      <Link
                        href={`/admin/surveys/${survey.id}/edit`}
                        className="text-xs font-medium text-[#99f7ff] transition-colors hover:text-[#d7fbff]"
                      >
                        Edit
                      </Link>
                      <SurveyStatusToggle id={survey.id} status={survey.status} />
                      <Link
                        href={`/admin/surveys/${survey.id}/results`}
                        className="text-xs font-medium text-[#a9abb5] transition-colors hover:text-[#e8f4ff]"
                      >
                        Results
                      </Link>
                      <SurveyDeleteButton id={survey.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
