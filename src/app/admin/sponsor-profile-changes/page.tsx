import { redirect } from 'next/navigation'

export default function SponsorProfileChangesPage() {
  redirect('/admin/verification-queue?tab=profile-changes')
}
