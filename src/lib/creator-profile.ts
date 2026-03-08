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

