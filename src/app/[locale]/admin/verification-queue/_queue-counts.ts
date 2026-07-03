import { prisma } from '@/lib/prisma'

export async function getVerificationQueueCounts() {
  const [submissions, profileChanges, launches, pendingRefunds, optOuts] = await Promise.all([
    prisma.deal_submissions.count({ where: { status: 'submitted' } }),
    prisma.sponsor_age_restriction_requests.count({ where: { status: 'pending' } }),
    prisma.sanctioned_launch_requests.count({ where: { verdict: 'pending' } }),
    prisma.refund_requests.count({ where: { verdict: 'pending' } }),
    prisma.creator_opt_outs.count({ where: { verdict: 'pending' } }),
  ])
  return { submissions, profileChanges, launches, pendingRefunds, optOuts }
}
