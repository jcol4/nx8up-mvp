import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCampaignById, getMyApplication } from '../_actions'
import ApplyButton from './ApplyButton'
import Panel from '@/components/shared/Panel'

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [campaign, myApplication] = await Promise.all([
    getCampaignById(id),
    getMyApplication(id),
  ])

  if (!campaign) notFound()

  const alreadyApplied = myApplication != null

  return (
    <main className="max-w-3xl mx-auto p-6 sm:p-8">
      <div className="mb-6">
        <Link href="/creator/campaigns" className="text-xs cr-accent hover:underline">← Back to Campaigns</Link>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {/* Main info */}
        <div className="md:col-span-2 space-y-5">
          <Panel variant="creator" title={campaign.title}>
            <p className="text-sm cr-text-muted mb-3">
              by {campaign.sponsor.company_name ?? 'Sponsor'}
            </p>
            {campaign.description && (
              <p className="text-sm cr-text leading-relaxed">{campaign.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {campaign.game_category.map((g: string) => (
                <span key={g} className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">{g}</span>
              ))}
              {campaign.content_type.map((t: string) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7]">{t}</span>
              ))}
              {campaign.platform.map((p: string) => (
                <span key={p} className="text-xs px-2 py-0.5 rounded bg-[#22c55e]/10 text-[#22c55e]">{p}</span>
              ))}
            </div>
          </Panel>

          {/* Requirements */}
          {(campaign.min_avg_viewers || campaign.min_subs_followers || campaign.min_engagement_rate) && (
            <Panel variant="creator" title="Requirements">
              <ul className="space-y-2 text-sm cr-text">
                {campaign.min_avg_viewers && (
                  <li className="flex justify-between">
                    <span className="cr-text-muted">Min. avg viewers</span>
                    <span className="cr-text-bright font-medium">{campaign.min_avg_viewers.toLocaleString()}</span>
                  </li>
                )}
                {campaign.min_subs_followers && (
                  <li className="flex justify-between">
                    <span className="cr-text-muted">Min. followers/subs</span>
                    <span className="cr-text-bright font-medium">{campaign.min_subs_followers.toLocaleString()}</span>
                  </li>
                )}
                {campaign.min_engagement_rate && (
                  <li className="flex justify-between">
                    <span className="cr-text-muted">Min. engagement rate</span>
                    <span className="cr-text-bright font-medium">{Number(campaign.min_engagement_rate).toFixed(1)}%</span>
                  </li>
                )}
              </ul>
            </Panel>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Panel variant="creator">
            {campaign.budget != null && (
              <div className="mb-4 text-center">
                <p className="text-2xl font-bold cr-success">${campaign.budget.toLocaleString()}</p>
                <p className="text-xs cr-text-muted mt-0.5">Campaign Budget</p>
              </div>
            )}
            <ul className="space-y-2 text-xs cr-text-muted mb-4">
              <li className="flex justify-between">
                <span>Applicants</span>
                <span className="cr-text-bright">{campaign._count.applications}</span>
              </li>
              {campaign.deadline && (
                <li className="flex justify-between">
                  <span>Deadline</span>
                  <span className="cr-text-bright">{new Date(campaign.deadline).toLocaleDateString()}</span>
                </li>
              )}
              <li className="flex justify-between">
                <span>Status</span>
                <span className="capitalize text-[#22c55e]">{campaign.status}</span>
              </li>
            </ul>

            {alreadyApplied ? (
              <div className="w-full py-2.5 rounded-lg text-center text-sm font-medium bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">
                ✓ Applied — {myApplication!.status.charAt(0).toUpperCase() + myApplication!.status.slice(1)}
              </div>
            ) : (
              <ApplyButton campaignId={campaign.id} />
            )}
          </Panel>
        </div>
      </div>
    </main>
  )
}