import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

function isAdmin(sessionClaims: Record<string, unknown> | null | undefined) {
  return (sessionClaims?.metadata as { role?: string })?.role === 'admin'
}

/**
 * GET /api/admin/surveys/[id]/results
 * Returns all responses with per-question option tallies split by creator/sponsor.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { sessionClaims } = await auth()
  if (!isAdmin(sessionClaims)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: 'asc' } },
      responses: true,
    },
  })
  if (!survey) return Response.json({ error: 'Not found' }, { status: 404 })

  const creatorResponses = survey.responses.filter(r => r.role === 'creator')
  const sponsorResponses = survey.responses.filter(r => r.role === 'sponsor')

  const questionResults = survey.questions.map(q => {
    const tally = (responses: typeof survey.responses) => {
      const counts: Record<string, number> = {}
      for (const option of q.options) counts[option] = 0
      for (const r of responses) {
        const answers = r.answers as Record<string, string>
        const chosen = answers[q.id]
        if (chosen && counts[chosen] !== undefined) counts[chosen]++
      }
      return counts
    }

    return {
      question: { id: q.id, text: q.text, options: q.options, order: q.order },
      creator: tally(creatorResponses),
      sponsor: tally(sponsorResponses),
    }
  })

  const dates = survey.responses.map(r => r.submittedAt)
  const dateRange = dates.length
    ? { from: new Date(Math.min(...dates.map(d => d.getTime()))), to: new Date(Math.max(...dates.map(d => d.getTime()))) }
    : null

  return Response.json({
    survey: { id: survey.id, title: survey.title, status: survey.status },
    totalResponses: survey.responses.length,
    creatorCount: creatorResponses.length,
    sponsorCount: sponsorResponses.length,
    dateRange,
    questionResults,
  })
}
