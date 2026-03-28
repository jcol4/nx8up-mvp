export type CreatorProfile = {
  displayName?: string
  bio?: string
  categories?: string[]
  urls?: { label?: string; url: string }[]
  /** From DB (content_creators) */
  location?: string
  country?: string
  state?: string
  city?: string
  platform?: string[]
  game_category?: string[]
  language?: string[]
  most_played_games?: string[]
  /** Audience demographics (creator-entered) */
  audience_age_min?: number
  audience_age_max?: number
  audience_locations?: string[]
  audience_gender?: string[]
  /** Creator identity */
  creator_types?: string[]
  primary_platform?: string
  /** Content & audience tags */
  content_style?: string[]
  audience_interests?: string[]
  /** Brand & campaign preferences */
  preferred_campaign_types?: string[]
  preferred_product_types?: string[]
  /** Eligibility */
  is_available?: boolean
  max_campaigns_per_month?: number
}

export const DEFAULT_CONTENT_CATEGORIES = [
  'Gaming',
  'Talking / Podcast',
  'Vlogging',
  'Tutorials / How-to',
  'Reactions',
  'Music',
  'Sports',
  'Other',
] as const

export function suggestContentTypes(broadcasterType: string | null | undefined): string[] {
  if (!broadcasterType) return []

  if (broadcasterType === 'partner' || broadcasterType === 'affiliate') {
    return ['Gaming']
  }
  return []
}