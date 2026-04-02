export type ProfileIncompleteField = {
  label: string
  description: string
}

/** Returns a list of missing required fields. Empty array means the profile is complete. */
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
