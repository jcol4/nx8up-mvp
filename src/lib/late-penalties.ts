import { prisma } from '@/lib/prisma'
import { recordReputationEvent, proofDeadline, latePenaltyOwed, LATE_PENALTY_CAP } from '@/lib/reputation'

const MS_PER_DAY = 86_400_000

export async function applyLatePenalties() {
  const now = Date.now()

  const lateApps = await prisma.campaign_applications.findMany({
    where: {
      status: 'accepted',
      late_penalty_applied: { lt: LATE_PENALTY_CAP },
      campaign: { end_date: { not: null } },
      deal_submission: null,
    },
    select: {
      id: true,
      creator_id: true,
      late_penalty_applied: true,
      campaign: { select: { end_date: true } },
    },
  })

  for (const app of lateApps) {
    const deadline = proofDeadline(app.campaign.end_date!)
    const msLate = now - deadline.getTime()
    if (msLate <= 0) continue

    const daysLate = Math.floor(msLate / MS_PER_DAY)
    const totalOwed = latePenaltyOwed(daysLate)
    if (totalOwed <= app.late_penalty_applied) continue

    await recordReputationEvent({
      type: 'proof_late',
      creatorId: app.creator_id,
      daysLate,
      alreadyPenalized: app.late_penalty_applied,
    })
    await prisma.campaign_applications.update({
      where: { id: app.id },
      data: { late_penalty_applied: totalOwed },
    })
  }
}
