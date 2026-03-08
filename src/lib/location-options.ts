/** Country / State / City options for creator profile location. */

export const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Mexico',
  'Brazil',
  'Other',
] as const

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'District of Columbia',
] as const

/** Canadian provinces */
export const CA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
] as const

/** UK nations */
export const UK_NATIONS = ['England', 'Scotland', 'Wales', 'Northern Ireland'] as const

export const CREATOR_PLATFORMS = ['Twitch', 'YouTube'] as const

export const COMMON_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Japanese',
  'Korean',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'Arabic',
  'Hindi',
  'Russian',
  'Italian',
  'Dutch',
  'Polish',
  'Turkish',
  'Other',
] as const

export function parseLocation(location: string | null | undefined): { country: string; state: string; city: string } {
  if (!location?.trim()) return { country: '', state: '', city: '' }
  const parts = location.split(',').map((p) => p.trim())
  if (parts.length >= 3) return { city: parts[0] ?? '', state: parts[1] ?? '', country: parts[2] ?? '' }
  if (parts.length === 2) return { city: '', state: parts[0] ?? '', country: parts[1] ?? '' }
  return { city: '', state: '', country: parts[0] ?? '' }
}

export function formatLocation(city: string, state: string, country: string): string {
  const parts = [city.trim(), state.trim(), country.trim()].filter(Boolean)
  return parts.join(', ')
}
