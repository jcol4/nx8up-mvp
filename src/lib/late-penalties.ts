import { prisma } from '@/lib/prisma'
import { adjustCreatorReputation, proofDeadline, LATE_PENALTY_PER_DAY, LATE_PENALTY_CAP } from '@/lib/reputation'

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
    const totalOwed = Math.min(daysLate * LATE_PENALTY_PER_DAY, LATE_PENALTY_CAP)
    const delta = totalOwed - app.late_penalty_applied
    if (delta <= 0) continue

    await adjustCreatorReputation(app.creator_id, -delta)
    await prisma.campaign_applications.update({
      where: { id: app.id },
      data: { late_penalty_applied: totalOwed },
    })
  }
}
