import { redirect } from 'next/navigation'

/**
 * Admin Academy — same content as the creator Academy listing.
 * Creator layout allows admins; reuse that experience instead of a stub page.
 */
export default function AdminAcademyPage() {
  redirect('/creator/academy')
}
