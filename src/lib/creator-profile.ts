export type CreatorProfile = {
  displayName?: string
  bio?: string
  categories?: string[]
  urls?: { label?: string; url: string }[]
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

