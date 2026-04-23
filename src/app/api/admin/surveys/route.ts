import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

function isAdmin(sessionClaims: Record<string, unknown> | null | undefined) {
  return (sessionClaims?.metadata as { role?: string })?.role === 'admin'
}

/** GET /api/admin/surveys — Lists all surveys with response counts. */
export async function GET() {
  const { sessionClaims } = await auth()
  if (!isAdmin(sessionClaims)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const surveys = await prisma.survey.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      questions: { orderBy: { order: 'asc' } },
      _count: { select: { responses: true } },
    },
  })

  return Response.json({ surveys })
}

/** POST /api/admin/surveys — Creates a new survey in draft status. */
export async function POST(request: Request) {
  const { sessionClaims } = await auth()
  if (!isAdmin(sessionClaims)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, description, targetRoles, status } = body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return Response.json({ error: 'Title is required' }, { status: 400 })
  }
  if (!Array.isArray(targetRoles) || targetRoles.length === 0) {
    return Response.json({ error: 'At least one target role is required' }, { status: 400 })
  }

  const survey = await prisma.survey.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      targetRoles,
      status: status === 'active' ? 'active' : 'draft',
    },
  })

  return Response.json({ survey }, { status: 201 })
}
