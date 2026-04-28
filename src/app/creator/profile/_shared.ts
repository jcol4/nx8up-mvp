/**
 * Shared types, constants, and helpers for the creator profile wizard.
 *
 * `CreatorProfileDraft` is the in-memory shape of the wizard state, passed
 * between steps and persisted to the DB via `updateCreatorProfileWizard`.
 * Age and campaign-count fields are strings (not numbers) because they bind
 * directly to `<input type="number">` values in React.
 *
 * All option arrays (`CREATOR_TYPE_OPTIONS`, etc.) are the source of truth
 * for the wizard UI — they must stay in sync with DB enum values / matching
 * logic in `@/lib/matching`.
 *
 * `toggleBtn` and the CSS class helpers (`labelClass`, `sectionTitle`) are
 * shared across all step components to ensure visual consistency.
 */

/**
 * Full profile draft shape. Every field maps to a wizard step:
 *  - Step 3: displayName, bio, country, state, city, language, creator_types, primary_platform
 *  - Step 4: platform, game_category, content_style, content_type, audience_*
 *  - Step 5: preferred_campaign_types, preferred_product_types
 *  - Step 6: is_available, max_campaigns_per_month
 */
export type CreatorProfileDraft = {
  // Step 3 - Creator Identity
  displayName: string
  bio: string
  country: string
  state: string
  city: string
  language: string[]
  creator_types: string[]
  primary_platform: string
  // Step 4 - Content & Audience Tags
  platform: string[]
  game_category: string[]
  content_style: string[]
  content_type: string[]
  audience_interests: string[]
  audience_gender: string[]
  audience_age_min: string
  audience_age_max: string
  audience_locations: string[]
  // Step 5 - Brand & Campaign Preferences
  preferred_campaign_types: string[]
  preferred_product_types: string[]
  // Step 6 - Basic Eligibility Settings
  is_available: boolean
  max_campaigns_per_month: string
}

export const EMPTY_DRAFT: CreatorProfileDraft = {
  displayName: '',
  bio: '',
  country: '',
  state: '',
  city: '',
  language: [],
  creator_types: [],
  primary_platform: '',
  platform: [],
  game_category: [],
  content_style: [],
  content_type: [],
  audience_interests: [],
  audience_gender: [],
  audience_age_min: '',
  audience_age_max: '',
  audience_locations: [],
  preferred_campaign_types: [],
  preferred_product_types: [],
  is_available: true,
  max_campaigns_per_month: '',
}

export const STEP_LABELS = [
  'Accounts',
  'Metrics',
  'Identity',
  'Content',
  'Brands',
  'Eligibility',
  'Summary',
]

export const CREATOR_TYPE_OPTIONS = [
  { value: 'competitive_gamer', label: 'Competitive Gamer', description: 'Tournament and ranked competitive play' },
  { value: 'streamer', label: 'Streamer', description: 'Live streaming on Twitch or YouTube' },
  { value: 'content_creator', label: 'Content Creator', description: 'Produced video, shorts, VOD content' },
]

export const PLATFORM_OPTIONS = ['Twitch', 'YouTube', 'TikTok', 'Instagram', 'X (Twitter)', 'Facebook']

export const CONTENT_STYLE_OPTIONS = [
  'Educational',
  'Entertaining',
  'Competitive',
  'Casual',
  'Variety',
  'Highlights',
  'Reviews',
  'Tutorials',
  'Reaction',
  'IRL / Lifestyle',
]

export const CONTENT_CATEGORY_OPTIONS = [
  'Gaming',
  'Talking / Podcast',
  'Vlogging',
  'Tutorials / How-to',
  'Reactions',
  'Music',
  'Sports',
  'Other',
]

export const AUDIENCE_GENDER_OPTIONS = ['Male', 'Female', 'Mixed'] as const

export const AUDIENCE_LOCATION_OPTIONS = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Mexico',
  'Brazil',
  'Japan',
  'South Korea',
  'India',
  'Philippines',
  'Indonesia',
  'Netherlands',
  'Sweden',
  'Other',
]

export const PREFERRED_CAMPAIGN_TYPE_OPTIONS = [
  { value: 'use_and_show', label: 'Use & Show', description: 'Feature product naturally in content' },
  { value: 'explain_and_demo', label: 'Explain & Demo', description: 'Dedicated product walkthrough' },
  { value: 'mention_and_repeat', label: 'Mention & Repeat', description: 'Verbal sponsor mentions' },
  { value: 'compete_and_feature', label: 'Compete & Feature', description: 'Tournament / event sponsorship' },
]

export const PREFERRED_PRODUCT_TYPE_OPTIONS = [
  { value: 'consumable', label: 'Consumable', description: 'Food, drinks, supplements' },
  { value: 'gaming_hardware', label: 'Gaming Hardware', description: 'Peripherals, gear, setups' },
  { value: 'digital_product', label: 'Digital Product', description: 'Software, games, subscriptions' },
  { value: 'fashion_lifestyle', label: 'Fashion & Lifestyle', description: 'Apparel, accessories' },
  { value: 'event_experience', label: 'Event / Experience', description: 'Tournaments, events, venues' },
]

export const COMMON_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'Portuguese',
  'German',
  'Japanese',
  'Korean',
  'Chinese',
  'Russian',
  'Arabic',
]

export const labelClass = 'block text-sm font-medium text-[#a9abb5] mb-1.5'
export const sectionTitle =
  'font-headline text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99f7ff] mb-3'

/**
 * Returns the Tailwind class string for a toggle button, switching between
 * active (cyan) and inactive (muted) visual states.
 */
export function toggleBtn(active: boolean): string {
  return `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
    active
      ? 'bg-[#99f7ff] text-slate-900 border-[#99f7ff] shadow-[0_0_14px_rgba(153,247,255,0.3)]'
      : 'border-white/10 text-[#a9abb5] hover:text-[#e8f4ff] hover:border-[#99f7ff]/35 hover:bg-[#99f7ff]/5'
  }`
}
