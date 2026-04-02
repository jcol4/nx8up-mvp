// Shared types and style helpers for the campaign creation wizard

export type CampaignDraft = {
  // Step 1 — Basics
  title: string
  brand_name: string
  product_name: string
  product_type: string
  objective: string
  platform: string[]

  // Step 2 — Audience
  audience_age_min: string
  audience_age_max: string
  target_genders: string[]
  required_audience_locations: string[]
  target_cities: string
  target_interests: string[]

  // Step 3 — Creators
  creator_types: string[]
  creator_sizes: string[]
  min_subs_followers: string
  min_engagement_rate: string

  // Step 4 — Budget
  budget: string
  creator_count: string
  payment_model: string
  start_date: string
  end_date: string

  // Step 5 — Content
  accepted_media_types: string[]
  campaign_type: string
  num_videos: string
  video_includes: string[]
  num_streams: string
  min_stream_duration: string
  num_posts: string
  num_short_videos: string
  content_guidelines: string
  must_include_link: boolean
  must_include_promo_code: boolean
  must_tag_brand: boolean

  // Step 6 — Tracking
  landing_page_url: string
  tracking_type: string
  conversion_goal: string
}

export const EMPTY_DRAFT: CampaignDraft = {
  title: '',
  brand_name: '',
  product_name: '',
  product_type: '',
  objective: '',
  platform: [],
  audience_age_min: '',
  audience_age_max: '',
  target_genders: [],
  required_audience_locations: [],
  target_cities: '',
  target_interests: [],
  creator_types: [],
  creator_sizes: [],
  min_subs_followers: '',
  min_engagement_rate: '',
  budget: '',
  creator_count: '',
  payment_model: 'fixed_per_creator',
  start_date: '',
  end_date: '',
  accepted_media_types: [],
  campaign_type: '',
  num_videos: '',
  video_includes: [],
  num_streams: '',
  min_stream_duration: '',
  num_posts: '',
  num_short_videos: '',
  content_guidelines: '',
  must_include_link: false,
  must_include_promo_code: false,
  must_tag_brand: false,
  landing_page_url: '',
  tracking_type: '',
  conversion_goal: '',
}

export const labelClass = 'block text-sm font-medium dash-text-muted mb-1.5'
export const sectionClass = 'space-y-4 pb-6 border-b dash-border'
export const sectionTitle = 'text-xs font-semibold uppercase tracking-widest dash-text-muted mb-3'

export const toggleBtn = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
    active
      ? 'bg-[#00c8ff] text-black border-[#00c8ff] shadow-[0_0_14px_rgba(0,200,255,0.35)]'
      : 'dash-border dash-text-muted hover:text-[#c8dff0] hover:border-[rgba(0,200,255,0.35)] hover:bg-[rgba(0,200,255,0.05)] hover:shadow-[0_0_14px_rgba(0,200,255,0.12)]'
  }`

export const STEP_LABELS = [
  'Basics',
  'Audience',
  'Creators',
  'Budget',
  'Content',
  'Tracking',
  'Review',
]

export const PRODUCT_TYPES = [
  { value: 'consumable',        label: 'Consumable',         description: 'Drinks, snacks, supplements' },
  { value: 'gaming_hardware',   label: 'Gaming Hardware',    description: 'Headsets, keyboards, gear' },
  { value: 'digital_product',   label: 'Digital Product',    description: 'Apps, fintech, services' },
  { value: 'fashion_lifestyle', label: 'Fashion / Lifestyle', description: 'Apparel, accessories' },
  { value: 'event_experience',  label: 'Event / Experience', description: 'Tickets, live events' },
]

export const OBJECTIVES = [
  { value: 'awareness',   label: 'Awareness',   description: 'Grow brand recognition & reach' },
  { value: 'engagement',  label: 'Engagement',  description: 'Drive likes, comments & shares' },
  { value: 'traffic',     label: 'Traffic',     description: 'Send audiences to your site' },
  { value: 'conversions', label: 'Conversions', description: 'Generate sign-ups or purchases' },
]

export const PLATFORMS = ['YouTube', 'Twitch', 'TikTok', 'Instagram'] as const

export const MEDIA_TYPES = [
  { value: 'youtube_video', label: 'YouTube Video',  platform: 'YouTube', description: 'Standard long-form YouTube upload' },
  { value: 'youtube_short', label: 'YouTube Short',  platform: 'YouTube', description: 'Vertical short-form (≤ 60 sec)' },
  { value: 'twitch_stream', label: 'Twitch Stream',  platform: 'Twitch',  description: 'Live stream VOD' },
  { value: 'twitch_clip',   label: 'Twitch Clip',    platform: 'Twitch',  description: 'Short highlight clip from a stream' },
] as const

export const GENDERS = ['Male', 'Female', 'All'] as const

export const AUDIENCE_LOCATIONS = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Spain', 'Mexico', 'Brazil', 'Japan', 'South Korea', 'India',
  'Philippines', 'Indonesia', 'Netherlands', 'Sweden', 'Other',
] as const

export const CREATOR_TYPES = [
  {
    value: 'competitive_gamers',
    label: 'Competitive Gamers',
    description: 'Build trust through real gameplay',
  },
  {
    value: 'streamers',
    label: 'Streamers',
    description: 'Drive real-time engagement and repeat exposure',
  },
  {
    value: 'content_creators',
    label: 'Content Creators',
    description: 'Create scalable, discoverable content',
  },
]

export const CREATOR_SIZES = [
  { value: 'nano',  label: 'Nano',   description: '1K – 10K' },
  { value: 'micro', label: 'Micro',  description: '10K – 50K' },
  { value: 'mid',   label: 'Mid',    description: '50K – 250K' },
  { value: 'large', label: 'Large',  description: '250K+' },
]

export const MISSION_TYPES = [
  { value: 'use_and_show',       label: 'Use + Show',       description: 'Creator actively uses the product on stream' },
  { value: 'explain_and_demo',   label: 'Explain + Demo',   description: 'Creator explains and demonstrates the product' },
  { value: 'mention_and_repeat', label: 'Mention + Repeat', description: 'Recurring brand mentions across content' },
  { value: 'compete_and_feature', label: 'Compete + Feature', description: 'Product featured in competitive gameplay' },
]

export const VIDEO_INCLUDES = [
  { value: 'full_video',       label: 'Full video' },
  { value: 'dedicated_review', label: 'Dedicated review' },
  { value: 'mention',          label: 'Mention / integration' },
]

export const TRACKING_TYPES = [
  { value: 'unique_link',  label: 'Unique Link',   description: 'Auto-generated tracking URL per creator' },
  { value: 'promo_code',   label: 'Promo Code',    description: 'Creator shares a custom discount code' },
  { value: 'both',         label: 'Both',          description: 'Link + promo code for maximum coverage' },
]

export const CONVERSION_GOALS = [
  { value: 'purchase',       label: 'Purchase' },
  { value: 'signup',         label: 'Sign Up' },
  { value: 'app_install',    label: 'App Install' },
  { value: 'awareness_only', label: 'Awareness only' },
]
