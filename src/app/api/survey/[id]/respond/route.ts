import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/survey/[id]/respond
 * Body: { answers: { [questionId]: selectedOption } }
 * Validates all questions answered, writes SurveyResponse, returns success.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!role || role === 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: surveyId } = await params
  const body = await request.json()
  const { answers } = body

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return Response.json({ error: 'Invalid answers' }, { status: 400 })
  }

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: { questions: true },
  })
  if (!survey) return Response.json({ error: 'Survey not found' }, { status: 404 })
  if (survey.status !== 'active') {
    return Response.json({ error: 'Survey is not active' }, { status: 400 })
  }
  if (!survey.targetRoles.includes(role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const unanswered = survey.questions.filter(q => !answers[q.id])
  if (unanswered.length > 0) {
    return Response.json({ error: 'All questions must be answered' }, { status: 400 })
  }

  const existing = await prisma.surveyResponse.findUnique({
    where: { surveyId_userId: { surveyId, userId } },
  })
  if (existing) {
    return Response.json({ error: 'Already submitted' }, { status: 409 })
  }

  await prisma.surveyResponse.create({
    data: { surveyId, userId, role, answers },
  })

  return Response.json({ success: true })
}
