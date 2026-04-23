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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold dash-text-bright">Surveys</h1>
          <p className="text-sm dash-text-muted mt-0.5">
            {surveys.length} total · {active} active · {draft} draft · {closed} closed
          </p>
        </div>
        <Link
          href="/admin/surveys/new"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#00c8ff] text-black hover:bg-[#00b8ef] transition-colors"
        >
          New Survey
        </Link>
      </div>

      {surveys.length === 0 ? (
        <div className="dash-panel p-8 text-center">
          <p className="dash-text-muted">No surveys yet.</p>
          <Link href="/admin/surveys/new" className="mt-3 inline-block text-sm dash-accent hover:underline">
            Create your first survey
          </Link>
        </div>
      ) : (
        <div className="dash-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dash-border">
                <th className="px-4 py-3 text-left text-xs font-semibold dash-text-muted uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold dash-text-muted uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold dash-text-muted uppercase tracking-wider">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold dash-text-muted uppercase tracking-wider">Responses</th>
                <th className="px-4 py-3 text-left text-xs font-semibold dash-text-muted uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold dash-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dash-border divide-opacity-50">
              {surveys.map(survey => (
                <tr key={survey.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <span className="dash-text-bright font-medium">{survey.title}</span>
                    {survey.description && (
                      <p className="text-xs dash-text-muted mt-0.5 line-clamp-1">{survey.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[survey.status] ?? 'bg-[#94a3b8]/20 text-[#94a3b8]'}`}>
                      {survey.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="dash-text-muted capitalize">
                      {survey.targetRoles.join(', ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 dash-text-muted">{survey._count.responses}</td>
                  <td className="px-4 py-3 dash-text-muted text-xs">
                    {new Date(survey.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/surveys/${survey.id}/edit`}
                        className="text-xs dash-accent hover:underline"
                      >
                        Edit
                      </Link>
                      <SurveyStatusToggle id={survey.id} status={survey.status} />
                      <Link
                        href={`/admin/surveys/${survey.id}/results`}
                        className="text-xs dash-text-muted hover:dash-text-bright transition-colors"
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
      )}
    </div>
  )
}
