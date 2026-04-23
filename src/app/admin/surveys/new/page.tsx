import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import SurveyForm from '../SurveyForm'

export const metadata = { title: 'New Survey — nx8up Admin' }

export default async function NewSurveyPage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  return <SurveyForm />
}
