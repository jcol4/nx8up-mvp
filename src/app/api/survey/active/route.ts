import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/survey/active
 * Returns the most recent active survey the authed user hasn't completed,
 * filtered by their role. Admins never see surveys. Returns null if none.
 */
export async function GET() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return Response.json({ survey: null })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || role === 'admin') return Response.json({ survey: null })

  const completed = await prisma.surveyResponse.findMany({
    where: { userId },
    select: { surveyId: true },
  })
  const completedIds = completed.map(r => r.surveyId)

  const survey = await prisma.survey.findFirst({
    where: {
      status: 'active',
      targetRoles: { has: role },
      id: { notIn: completedIds.length > 0 ? completedIds : [''] },
    },
    orderBy: { createdAt: 'desc' },
    include: { questions: { orderBy: { order: 'asc' } } },
  })

  return Response.json({ survey })
}
