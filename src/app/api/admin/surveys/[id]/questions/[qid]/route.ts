import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

function isAdmin(sessionClaims: Record<string, unknown> | null | undefined) {
  return (sessionClaims?.metadata as { role?: string })?.role === 'admin'
}

/** PATCH /api/admin/surveys/[id]/questions/[qid] — Edits a question. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const { sessionClaims } = await auth()
  if (!isAdmin(sessionClaims)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id: surveyId, qid } = await params
  const body = await request.json()
  const { text, options, order } = body

  const existing = await prisma.surveyQuestion.findFirst({
    where: { id: qid, surveyId },
  })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const question = await prisma.surveyQuestion.update({
    where: { id: qid },
    data: {
      ...(text != null && { text: String(text).trim() }),
      ...(Array.isArray(options) && options.length >= 2 && {
        options: options.map(String).filter(Boolean),
      }),
      ...(order != null && { order: Number(order) }),
    },
  })

  return Response.json({ question })
}

/** DELETE /api/admin/surveys/[id]/questions/[qid] — Removes a question. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const { sessionClaims } = await auth()
  if (!isAdmin(sessionClaims)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id: surveyId, qid } = await params

  const existing = await prisma.surveyQuestion.findFirst({
    where: { id: qid, surveyId },
  })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  await prisma.surveyQuestion.delete({ where: { id: qid } })

  return Response.json({ success: true })
}
