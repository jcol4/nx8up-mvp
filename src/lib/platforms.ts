/**
 * Platform ↔ OAuth linkage — the single source of truth for which content
 * platforms nx8up can verify, how requested content forms map to a platform,
 * and how to compute a creator's eligibility to apply / submit proof.
 *
 * Only **Twitch** and **YouTube** are verifiable today: they are the only two
 * OAuth integrations (a creator links them and we hold their account IDs).
 * Steam is OpenID read-only (never a content-delivery platform); TikTok /
 * Instagram have no OAuth integration yet. A campaign can therefore only be
 * verified end-to-end for the platforms in `SUPPORTED_PLATFORMS`.
 *
 * Consumed by three enforcement points:
 *  - the apply gate (`applyToCampaign` + campaign detail page),
 *  - the Deal Room proof gate (`submitProof`),
 *  - proof-URL host detection (`verify-proof-url.ts`).
 *
 * Adding a platform later = extend `SUPPORTED_PLATFORMS`, `MEDIA_TYPE_PLATFORM`,
 * the two field-based helpers, and `detectProofPlatform`'s host list.
 */

/** Platforms nx8up can verify via a linked OAuth account. */
export const SUPPORTED_PLATFORMS = ['Twitch', 'YouTube'] as const
export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number]

/**
 * Campaign media-type value → the platform that content is delivered on.
 * Mirrors `MEDIA_TYPES` in `sponsor/campaigns/new/_shared.ts`.
 */
export const MEDIA_TYPE_PLATFORM: Record<string, SupportedPlatform> = {
  youtube_video: 'YouTube',
  youtube_short: 'YouTube',
  twitch_stream: 'Twitch',
  twitch_clip: 'Twitch',
}

function isSupportedPlatform(value: string): value is SupportedPlatform {
  return (SUPPORTED_PLATFORMS as readonly string[]).includes(value)
}

/** The fields of a campaign needed to derive its requested platforms. */
export type CampaignPlatformInput = {
  platform: string[]
  content_type: string[]
}

/** The fields of a creator needed to derive their linked platforms. */
export type CreatorLinkInput = {
  twitch_id: string | null
  youtube_channel_id: string | null
}

/**
 * The supported platforms a campaign requests content on, derived from its
 * `content_type` (media forms) unioned with any supported values in its
 * `platform` array. Unsupported platforms (TikTok / Instagram / other) are
 * filtered out — we cannot verify them, so they never gate.
 */
export function requiredPlatformsForCampaign(campaign: CampaignPlatformInput): SupportedPlatform[] {
  const set = new Set<SupportedPlatform>()
  for (const ct of campaign.content_type) {
    const platform = MEDIA_TYPE_PLATFORM[ct]
    if (platform) set.add(platform)
  }
  for (const p of campaign.platform) {
    if (isSupportedPlatform(p)) set.add(p)
  }
  return [...set]
}

/** The platforms a creator has OAuth-linked (a non-null account ID). */
export function linkedPlatformsForCreator(creator: CreatorLinkInput): SupportedPlatform[] {
  const linked: SupportedPlatform[] = []
  if (creator.twitch_id) linked.push('Twitch')
  if (creator.youtube_channel_id) linked.push('YouTube')
  return linked
}

/**
 * Supported platforms the campaign requires that the creator has NOT linked.
 * Empty ⇒ the creator can apply. ALL semantics: every requested platform must
 * be linked (a campaign requesting both Twitch and YouTube needs both).
 */
export function missingLinkedPlatforms(
  campaign: CampaignPlatformInput,
  creator: CreatorLinkInput,
): SupportedPlatform[] {
  const linked = new Set(linkedPlatformsForCreator(creator))
  return requiredPlatformsForCampaign(campaign).filter((p) => !linked.has(p))
}

/**
 * The supported platform a proof URL is hosted on, or `null` for an
 * unsupported/unknown host (or an unparseable URL).
 */
export function detectProofPlatform(rawUrl: string): SupportedPlatform | null {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }
  const { hostname } = url
  if (hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'youtu.be') {
    return 'YouTube'
  }
  if (hostname === 'twitch.tv' || hostname === 'www.twitch.tv' || hostname === 'clips.twitch.tv') {
    return 'Twitch'
  }
  return null
}
