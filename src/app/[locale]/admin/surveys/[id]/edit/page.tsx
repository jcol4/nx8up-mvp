import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SurveyForm from '../../SurveyForm'

export const metadata = { title: 'Edit Survey — nx8up Admin' }

type Props = { params: Promise<{ id: string }> }

export default async function EditSurveyPage({ params }: Props) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const { id } = await params

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: 'asc' } } },
  })
  if (!survey) notFound()

  const initialQuestions = survey.questions.map((q, i) => ({
    localId: `existing_${q.id}`,
    id: q.id,
    text: q.text,
    options: q.options,
    order: q.order ?? i + 1,
  }))

  return (
    <SurveyForm
      surveyId={survey.id}
      initialTitle={survey.title}
      initialDescription={survey.description ?? ''}
      initialTargetRoles={survey.targetRoles}
      initialStatus={survey.status}
      initialQuestions={initialQuestions}
    />
  )
}
