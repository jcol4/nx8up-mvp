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
  average_viewers?: number
  subs_followers?: number  
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