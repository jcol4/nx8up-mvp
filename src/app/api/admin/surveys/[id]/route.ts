import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

function isAdmin(sessionClaims: Record<string, unknown> | null | undefined) {
  return (sessionClaims?.metadata as { role?: string })?.role === 'admin'
}

/** PATCH /api/admin/surveys/[id] — Updates title/description/status/targetRoles. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { sessionClaims } = await auth()
  if (!isAdmin(sessionClaims)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const { title, description, status, targetRoles } = body

  const existing = await prisma.survey.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  const validStatuses = ['draft', 'active', 'closed']

  const survey = await prisma.survey.update({
    where: { id },
    data: {
      ...(title != null && { title: String(title).trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(status != null && validStatuses.includes(status) && { status }),
      ...(Array.isArray(targetRoles) && targetRoles.length > 0 && { targetRoles }),
    },
  })

  return Response.json({ survey })
}

/** DELETE /api/admin/surveys/[id] — Deletes survey + cascade. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { sessionClaims } = await auth()
  if (!isAdmin(sessionClaims)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const existing = await prisma.survey.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  await prisma.survey.delete({ where: { id } })

  return Response.json({ success: true })
}
