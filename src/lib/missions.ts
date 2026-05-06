export type MissionType = 'gate' | 'field' | 'weekly'

export type Mission = {
  id: string
  title: string
  type: MissionType
  xp: number
}

export const MISSIONS: readonly Mission[] = [
  // ── Gate missions (pinned until permanently completed) ───────────────────
  { id: 'stripe', title: 'Set up your Stripe payout account', type: 'gate', xp: 200 },
  { id: 'platform', title: 'Connect Twitch or YouTube', type: 'gate', xp: 150 },

  // ── Field missions (permanently completed once field is populated) ────────
  { id: 'field_platforms', title: 'Select your active platforms', type: 'field', xp: 75 },
  { id: 'field_creator_types', title: 'Set your creator types', type: 'field', xp: 75 },
  { id: 'field_game_category', title: 'Add your game categories', type: 'field', xp: 75 },
  { id: 'field_content_type', title: 'Set your content formats', type: 'field', xp: 75 },
  { id: 'field_audience_age', title: 'Set your audience age range', type: 'field', xp: 100 },
  { id: 'field_audience_locations', title: 'Add your audience locations', type: 'field', xp: 100 },
  { id: 'field_audience_interests', title: 'Add audience interest tags', type: 'field', xp: 100 },
  { id: 'field_audience_gender', title: 'Set your audience gender breakdown', type: 'field', xp: 75 },
  { id: 'field_preferred_campaign_types', title: 'Set preferred campaign types', type: 'field', xp: 75 },
  { id: 'field_preferred_product_types', title: 'Set preferred product categories', type: 'field', xp: 75 },
  { id: 'field_is_available', title: 'Mark yourself as available', type: 'field', xp: 50 },

  // ── Weekly missions (repeatable each week) ────────────────────────────────
  { id: 'weekly_twitch_sync', title: 'Sync your Twitch stats', type: 'weekly', xp: 125 },
  { id: 'weekly_youtube_sync', title: 'Sync your YouTube stats', type: 'weekly', xp: 125 },
  { id: 'weekly_apply_campaign', title: 'Apply to a campaign this week', type: 'weekly', xp: 150 },
  { id: 'weekly_submit_proof', title: 'Submit proof for an active deal', type: 'weekly', xp: 200 },
  { id: 'weekly_accepted_application', title: 'Get an application accepted by a sponsor', type: 'weekly', xp: 175 },
  { id: 'weekly_respond_invite', title: 'Respond to a direct campaign invite', type: 'weekly', xp: 150 },
  { id: 'weekly_apply_3_campaigns', title: 'Apply to 3 campaigns this week', type: 'weekly', xp: 225 },
]
