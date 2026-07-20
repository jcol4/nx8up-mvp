/**
 * Shared "fully set up" bar for a content creator: profile filled in, a
 * platform connected, and payouts connected. Used both to gate the affiliate
 * link (only fully set up creators receive one) and to decide when a
 * referred creator's signup should reward their referrer.
 */
export function isCreatorFullySetUp(c: {
  platform: string[]
  twitch_username: string | null
  youtube_channel_name: string | null
  stripe_onboarding_complete: boolean
}): boolean {
  return (
    c.platform.length > 0 &&
    (!!c.twitch_username || !!c.youtube_channel_name) &&
    c.stripe_onboarding_complete
  )
}
