/**
 * Sponsor profile validation helpers.
 * Used to gate campaign creation and show completion prompts in the sponsor dashboard.
 */

/** Describes a single incomplete required field on a sponsor profile. */
export type ProfileIncompleteField = {
  /** Short field name shown in the UI completion checklist. */
  label: string
  /** Human-readable instruction for where/how to fill in the field. */
  description: string
}

/**
 * Returns a list of incomplete required fields for the given sponsor profile.
 * An empty array means the profile is complete and the sponsor may create campaigns.
 */
export function getMissingSponsorProfileFields(
  sponsor: {
    company_name?: string | null
    location?: string | null
    language?: string[]
    platform?: string[]
    content_type?: string[]
    budget_min?: number | null
    budget_max?: number | null
  }
): ProfileIncompleteField[] {
  const missing: ProfileIncompleteField[] = []

  if (!sponsor.company_name?.trim()) {
    missing.push({ label: 'Company name', description: 'Add your company name in the Company Info section.' })
  }
  if (!sponsor.location?.trim()) {
    missing.push({ label: 'Location', description: 'Select your country in the Company Info section.' })
  }
  if (!sponsor.language?.length) {
    missing.push({ label: 'Languages', description: 'Select at least one language in the Company Info section.' })
  }
  if (!sponsor.platform?.length) {
    missing.push({ label: 'Platforms', description: 'Select at least one platform in Campaign Preferences.' })
  }
  if (!sponsor.content_type?.length) {
    missing.push({ label: 'Content types', description: 'Select at least one content type in Campaign Preferences.' })
  }
  if (sponsor.budget_min == null) {
    missing.push({ label: 'Budget minimum', description: 'Enter a typical budget minimum in Campaign Preferences.' })
  }
  if (sponsor.budget_max == null) {
    missing.push({ label: 'Budget maximum', description: 'Enter a typical budget maximum in Campaign Preferences.' })
  }

  return missing
}
