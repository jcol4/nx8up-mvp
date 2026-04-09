import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../../../SponsorHeader'
import NewCampaignForm from '../../new/NewCampaignForm'
import type { CampaignDraft } from '../../new/_shared'
import { EMPTY_DRAFT } from '../../new/_shared'

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) redirect('/')

  const campaign = await prisma.campaigns.findFirst({
    where: { id, sponsor_id: sponsor.id, status: 'draft' },
  })

  if (!campaign) notFound()

  const initialDraft: CampaignDraft = {
    ...EMPTY_DRAFT,
    title: campaign.title,
    is_direct_invite: campaign.is_direct_invite,
    brand_name: campaign.brand_name ?? '',
    product_name: campaign.product_name ?? '',
    product_type: campaign.product_type ?? '',
    objective: campaign.objective ?? '',
    platform: campaign.platform ?? [],
    audience_age_min: campaign.min_audience_age?.toString() ?? '',
    audience_age_max: campaign.max_audience_age?.toString() ?? '',
    target_genders: campaign.target_genders ?? [],
    required_audience_locations: campaign.required_audience_locations ?? [],
    target_cities: campaign.target_cities ?? '',
    target_interests: campaign.target_interests ?? [],
    creator_types: campaign.creator_types ?? [],
    creator_sizes: campaign.creator_sizes ?? [],
    min_subs_followers: campaign.min_subs_followers?.toString() ?? '',
    min_engagement_rate: campaign.min_engagement_rate ? Number(campaign.min_engagement_rate).toString() : '',
    budget: campaign.budget?.toString() ?? '',
    creator_count: campaign.creator_count?.toString() ?? '',
    payment_model: campaign.payment_model ?? 'fixed_per_creator',
    preferred_payment_method: campaign.preferred_payment_method ?? 'card',
    start_date: campaign.start_date ? campaign.start_date.toISOString().split('T')[0] : '',
    end_date: campaign.end_date ? campaign.end_date.toISOString().split('T')[0] : '',
    campaign_type: campaign.campaign_type ?? '',
    num_videos: campaign.num_videos?.toString() ?? '',
    video_includes: campaign.video_includes ?? [],
    num_youtube_shorts: campaign.num_youtube_shorts?.toString() ?? '',
    num_streams: campaign.num_streams?.toString() ?? '',
    num_twitch_clips: campaign.num_twitch_clips?.toString() ?? '',
    min_stream_duration: campaign.min_stream_duration?.toString() ?? '',
    num_posts: campaign.num_posts?.toString() ?? '',
    num_short_videos: campaign.num_short_videos?.toString() ?? '',
    content_guidelines: campaign.content_guidelines ?? '',
    must_include_link: campaign.must_include_link,
    must_include_promo_code: campaign.must_include_promo_code,
    must_tag_brand: campaign.must_tag_brand,
    landing_page_url: campaign.landing_page_url ?? '',
    tracking_type: campaign.tracking_type ?? '',
    conversion_goal: campaign.conversion_goal ?? '',
  }

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 sm:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold dash-text-bright">Edit Draft</h1>
            <p className="dash-text-muted text-sm mt-1">
              {campaign.campaign_code && (
                <span className="font-mono mr-2">{campaign.campaign_code}</span>
              )}
              Continue editing this draft campaign.
            </p>
          </div>
          <NewCampaignForm initialDraft={initialDraft} editingId={campaign.id} />
        </div>
      </div>
    </>
  )
}
