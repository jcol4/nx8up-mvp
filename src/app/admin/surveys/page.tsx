import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import SurveyDeleteButton from './SurveyDeleteButton'
import SurveyStatusToggle from './SurveyStatusToggle'

export const metadata = { title: 'Surveys — nx8up Admin' }

const STATUS_STYLE: Record<string, string> = {
  active:
    'rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#86efac]',
  draft:
    'rounded-full border border-slate-400/35 bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-200',
  closed:
    'rounded-full border border-[#f87171]/40 bg-[#f87171]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#fca5a5]',
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
  const draft = surveys.filter(s => s.status === 'draft').length
  const closed = surveys.filter(s => s.status === 'closed').length

  return (
    <div className="admin-surveys admin-surveys-detail mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="cr-field-label">Admin center</p>
          <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Surveys</h1>
          <p className="mt-2 text-sm leading-relaxed cr-text-muted">
            {surveys.length} total · collect feedback from creators and sponsors
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-2.5 py-1 text-xs font-semibold text-[#86efac]">
            {active} active
          </span>
          <span className="rounded-full border border-slate-400/35 bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-200">
            {draft} draft
          </span>
          <span className="rounded-full border border-[#f87171]/40 bg-[#f87171]/15 px-2.5 py-1 text-xs font-semibold text-[#fca5a5]">
            {closed} closed
          </span>
          <Link
            href="/admin/surveys/new"
            className="rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/15 px-4 py-2 text-sm font-semibold text-[#bffcff] transition hover:border-[#99f7ff]/50 hover:bg-[#99f7ff]/25"
          >
            New survey
          </Link>
        </div>
      </div>

      {surveys.length === 0 ? (
        <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-10 text-center">
          <p className="text-sm font-medium text-[#e8f4ff]">No surveys yet</p>
          <Link
            href="/admin/surveys/new"
            className="mt-3 inline-block text-sm font-semibold text-[#bffcff] hover:text-[#99f7ff] hover:underline"
          >
            Create your first survey
          </Link>
        </div>
      ) : (
        <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20">
          <div className="overflow-x-auto">
            <table className="sp-ledger-table w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 text-left">Title</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Target</th>
                  <th className="px-5 py-3 text-left">Responses</th>
                  <th className="px-5 py-3 text-left">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map(survey => (
                  <tr key={survey.id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-[#e8f4ff]">{survey.title}</span>
                      {survey.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs cr-text-muted">{survey.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex capitalize ${STATUS_STYLE[survey.status] ?? STATUS_STYLE.draft}`}
                      >
                        {survey.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 capitalize cr-text">{survey.targetRoles.join(', ')}</td>
                    <td className="px-5 py-3 font-semibold tabular-nums text-[#e8f4ff]">
                      {survey._count.responses}
                    </td>
                    <td className="px-5 py-3 text-xs tabular-nums cr-stat-caption">
                      {new Date(survey.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          href={`/admin/surveys/${survey.id}/edit`}
                          className="text-xs font-medium text-[#bffcff] hover:text-[#99f7ff]"
                        >
                          Edit
                        </Link>
                        <SurveyStatusToggle id={survey.id} status={survey.status} />
                        <Link
                          href={`/admin/surveys/${survey.id}/results`}
                          className="text-xs font-semibold text-[#bffcff] hover:text-[#99f7ff]"
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
  )
}
