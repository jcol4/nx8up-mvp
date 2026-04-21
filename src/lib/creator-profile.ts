/**
 * Creator profile types, defaults, and helpers shared across profile pages,
 * onboarding flows, and the matching engine input builder.
 */

/** All editable/displayable fields on a creator's profile. All fields are optional
 *  since the object is built incrementally across multiple onboarding steps. */
export type CreatorProfile = {
  displayName?: string
  bio?: string
  /** Legacy content category tags (pre-matching). */
  categories?: string[]
  /** External links shown on the creator's public profile. */
  urls?: { label?: string; url: string }[]
  /** Formatted location string (e.g. "Austin, TX, United States"). */
  location?: string
  country?: string
  state?: string
  city?: string
  /** Platforms the creator is active on (e.g. ["Twitch", "YouTube"]). */
  platform?: string[]
  /** Game/genre tags synced from Twitch/YouTube stats. */
  game_category?: string[]
  /** Languages the creator streams/publishes in. */
  language?: string[]
  /** Top games by stream time, synced from platform APIs. */
  most_played_games?: string[]
  /** Lower bound of creator's self-reported audience age range. */
  audience_age_min?: number
  /** Upper bound of creator's self-reported audience age range. */
  audience_age_max?: number
  /** Country/region tags for where the creator's audience is located. */
  audience_locations?: string[]
  /** Audience gender tags (e.g. ["Male", "Female"]). */
  audience_gender?: string[]
  /** Creator archetype tags (e.g. ["Streamer", "Educator"]). */
  creator_types?: string[]
  /** The platform the creator is most active on. */
  primary_platform?: string
  /** Content format/style tags (e.g. ["Let's Play", "Tutorial"]). */
  content_style?: string[]
  /** Interest/topic tags describing the creator's audience. */
  audience_interests?: string[]
  /** Campaign delivery formats the creator prefers. */
  preferred_campaign_types?: string[]
  /** Product/brand categories the creator prefers to promote. */
  preferred_product_types?: string[]
  /** Whether the creator is currently open to new sponsorships. */
  is_available?: boolean
  /** Maximum number of active sponsorship campaigns at once. */
  max_campaigns_per_month?: number
}

/** Broad content categories shown in onboarding and profile setup. */
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

/**
 * Returns pre-filled content type suggestions based on the creator's Twitch
 * broadcaster type. Partners and affiliates default to Gaming since Twitch
 * requires content to qualify for those tiers.
 */
export function suggestContentTypes(broadcasterType: string | null | undefined): string[] {
  if (!broadcasterType) return []

  if (broadcasterType === 'partner' || broadcasterType === 'affiliate') {
    return ['Gaming']
  }
  return []
}