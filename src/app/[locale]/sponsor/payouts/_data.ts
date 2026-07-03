import { prisma } from '@/lib/prisma'
import { calcFeeBreakdown } from '@/lib/constants'

export async function getPayoutLedger(sponsorId: string) {
  const rows = await prisma.campaign_applications.findMany({
    where: {
      status: 'accepted',
      campaign: { sponsor_id: sponsorId },
      deal_submission: { isNot: null },
    },
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          budget: true,
          creator_count: true,
          end_date: true,
          status: true,
        },
      },
      creator: {
        select: {
          twitch_username: true,
          youtube_channel_name: true,
          platform: true,
        },
      },
      deal_submission: {
        select: {
          status: true,
          payout_status: true,
          stripe_transfer_id: true,
          submitted_at: true,
          updated_at: true,
        },
      },
      _count: { select: { link_clicks: true } },
    },
    orderBy: [{ campaign: { title: 'asc' } }, { submitted_at: 'desc' }],
  })

  return rows.map((app) => {
    const sub = app.deal_submission!
    const { perCreator } = calcFeeBreakdown(
      app.campaign.budget ?? 0,
      app.campaign.creator_count,
    )
    const handle =
      app.creator.twitch_username
        ? `@${app.creator.twitch_username}`
        : app.creator.youtube_channel_name
          ? `@${app.creator.youtube_channel_name}`
          : 'Unknown'

    return {
      applicationId: app.id,
      campaignId: app.campaign.id,
      campaignTitle: app.campaign.title,
      campaignBudget: app.campaign.budget,
      campaignStatus: app.campaign.status,
      creatorHandle: handle,
      platform: app.creator.platform.join(', '),
      submissionStatus: sub.status,
      payoutStatus: sub.payout_status ?? null,
      payoutAmount: perCreator,
      stripeTransferId: sub.stripe_transfer_id ?? null,
      submittedAt: sub.submitted_at,
      updatedAt: sub.updated_at,
      linkClicks: app._count.link_clicks,
    }
  })
}

export type LedgerRow = Awaited<ReturnType<typeof getPayoutLedger>>[number]
