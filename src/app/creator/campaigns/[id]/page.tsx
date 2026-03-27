import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getCampaignById, getMyApplication } from '../_actions'
import ApplyButton from './ApplyButton'
import { prisma } from '@/lib/prisma'
import { matchCreatorToCampaign } from '@/lib/matching'

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()

  const [campaign, myApplication, creatorProfile] = await Promise.all([
    getCampaignById(id),
    getMyApplication(id),
    userId
      ? prisma.content_creators.findUnique({
          where: { clerk_user_id: userId },
          select: {
            location: true,
            audience_age_min: true,
            audience_age_max: true,
            audience_locations: true,
            platform: true,
            subs_followers: true,
            youtube_subscribers: true,
            average_vod_views: true,
            youtube_avg_views: true,
            engagement_rate: true,
          },
        })
      : null,
  ])

  const { eligible, reasons } = creatorProfile && campaign
    ? matchCreatorToCampaign(creatorProfile, campaign)
    : { eligible: true, reasons: [] as string[] }

  if (!campaign) notFound()

  const alreadyApplied = myApplication != null
  const hasRequirements =
    campaign.min_avg_viewers ||
    campaign.min_subs_followers ||
    campaign.min_engagement_rate ||
    campaign.min_audience_age ||
    campaign.max_audience_age ||
    campaign.required_audience_locations.length > 0

  return (
    <main className="max-w-4xl mx-auto p-6 sm:p-8">
      {/* Back link */}
      <Link
        href="/creator/campaigns"
        className="inline-flex items-center gap-1.5 text-xs cr-text-muted hover:text-[#c8dff0] transition-colors mb-6"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Campaigns
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Header card */}
          <div className="cr-panel p-5 sm:p-6">
            {/* Platform + content type badges */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {campaign.platform.map((p: string) => (
                <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] font-medium border border-[#22c55e]/20">
                  {p}
                </span>
              ))}
              {campaign.content_type.map((t: string) => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-[#a855f7]/10 text-[#a855f7] font-medium border border-[#a855f7]/20">
                  {t}
                </span>
              ))}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold cr-text-bright mb-1">{campaign.title}</h1>
            <p className="text-sm cr-text-muted mb-4">
              by <span className="cr-text">{campaign.sponsor.company_name ?? 'Sponsor'}</span>
            </p>

            {campaign.description && (
              <p className="text-sm cr-text leading-relaxed">{campaign.description}</p>
            )}

            {/* Game / genre tags */}
            {campaign.game_category.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t cr-border">
                {campaign.game_category.map((g: string) => (
                  <span key={g} className="text-[11px] px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Requirements */}
          {hasRequirements && (
            <div className="cr-panel p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="cr-panel-title mb-0">Requirements</h2>
                {creatorProfile && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                    eligible
                      ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {eligible ? '✓ Eligible' : '✗ Requirements not met'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {campaign.min_avg_viewers != null && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-lg font-bold cr-text-bright">{campaign.min_avg_viewers.toLocaleString()}</p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Min. avg viewers</p>
                  </div>
                )}
                {campaign.min_subs_followers != null && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-lg font-bold cr-text-bright">{campaign.min_subs_followers.toLocaleString()}</p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Min. followers / subs</p>
                  </div>
                )}
                {campaign.min_engagement_rate != null && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-lg font-bold cr-text-bright">{Number(campaign.min_engagement_rate).toFixed(1)}%</p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Min. engagement rate</p>
                  </div>
                )}
                {(campaign.min_audience_age != null || campaign.max_audience_age != null) && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-lg font-bold cr-text-bright">
                      {campaign.min_audience_age ?? '?'}–{campaign.max_audience_age ?? '?'}
                    </p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Target audience age</p>
                  </div>
                )}
                {campaign.required_audience_locations.length > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center sm:col-span-2">
                    <p className="text-sm font-semibold cr-text-bright leading-snug">
                      {campaign.required_audience_locations.join(', ')}
                    </p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Required audience locations</p>
                  </div>
                )}
              </div>
              {!eligible && reasons.length > 0 && (
                <div className="mt-3 pt-3 border-t cr-border">
                  <p className="text-xs text-red-400/80 font-medium mb-1">Why you don't qualify:</p>
                  <ul className="space-y-0.5">
                    {reasons.map((r) => (
                      <li key={r} className="text-xs text-red-400/70">· {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Budget + meta card */}
          <div className="cr-panel p-5">
            {campaign.budget != null && (
              <div className="mb-4 pb-4 border-b cr-border text-center">
                <p className="text-3xl font-bold cr-success">${campaign.budget.toLocaleString()}</p>
                <p className="text-xs cr-text-muted mt-1">Campaign Budget</p>
              </div>
            )}

            <ul className="space-y-3 text-sm mb-5">
              <li className="flex justify-between items-center">
                <span className="cr-text-muted">Status</span>
                <span className="capitalize text-[#22c55e] font-medium text-xs px-2 py-0.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20">
                  {campaign.status}
                </span>
              </li>
              {campaign.end_date && (
                <li className="flex justify-between items-center">
                  <span className="cr-text-muted">Ends</span>
                  <span className="cr-text-bright font-medium text-xs">
                    {new Date(campaign.end_date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </li>
              )}
              <li className="flex justify-between items-center">
                <span className="cr-text-muted">Applicants</span>
                <span className="cr-text-bright font-medium text-xs">{campaign._count.applications}</span>
              </li>
            </ul>

            {alreadyApplied ? (
              <div className="w-full py-2.5 rounded-lg text-center text-sm font-semibold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">
                ✓ Applied — {myApplication!.status.charAt(0).toUpperCase() + myApplication!.status.slice(1)}
              </div>
            ) : (
              <ApplyButton
                campaignId={campaign.id}
                profileLocation={creatorProfile?.location ?? null}
                profileAudienceAgeMin={creatorProfile?.audience_age_min ?? null}
                profileAudienceAgeMax={creatorProfile?.audience_age_max ?? null}
                profileAudienceLocations={creatorProfile?.audience_locations ?? []}
                eligible={eligible}
                ineligibleReasons={reasons}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
