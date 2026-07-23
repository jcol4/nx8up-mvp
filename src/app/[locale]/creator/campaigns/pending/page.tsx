import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'

export default async function CreatorPendingCampaignsPage() {
  const locale = await getLocale()
  redirect({ href: { pathname: '/creator/campaigns', query: { tab: 'pending' } }, locale })
}
