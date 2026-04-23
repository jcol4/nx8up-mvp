import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

function isAdmin(sessionClaims: Record<string, unknown> | null | undefined) {
  return (sessionClaims?.metadata as { role?: string })?.role === 'admin'
}

/** POST /api/admin/surveys/[id]/questions — Adds a question to a survey. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { sessionClaims } = await auth()
  if (!isAdmin(sessionClaims)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id: surveyId } = await params
  const body = await request.json()
  const { text, options, order } = body

  if (!text || typeof text !== 'string' || !text.trim()) {
    return Response.json({ error: 'Question text is required' }, { status: 400 })
  }
  if (!Array.isArray(options) || options.length < 2) {
    return Response.json({ error: 'At least 2 options are required' }, { status: 400 })
  }

  const survey = await prisma.survey.findUnique({ where: { id: surveyId } })
  if (!survey) return Response.json({ error: 'Survey not found' }, { status: 404 })

  const maxOrder = await prisma.surveyQuestion.aggregate({
    where: { surveyId },
    _max: { order: true },
  })
  const nextOrder = order ?? (maxOrder._max.order ?? 0) + 1

  const question = await prisma.surveyQuestion.create({
    data: {
      surveyId,
      text: text.trim(),
      options: options.map(String).filter(Boolean),
      order: nextOrder,
    },
  })

  return Response.json({ question }, { status: 201 })
}
