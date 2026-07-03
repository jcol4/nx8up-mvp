import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    formats: {
      dateTime: {
        // Numeric date, e.g. "7/3/2026" (en) / "03/07/2026" (pt-BR)
        numeric: { day: 'numeric', month: 'numeric', year: 'numeric' },
        // Medium date, e.g. "Jul 3, 2026" (en) / "3 de jul. de 2026" (pt-BR)
        medium: { day: 'numeric', month: 'short', year: 'numeric' },
        // Month + day, e.g. "Jul 3" (en) / "3 de jul." (pt-BR)
        monthDay: { day: 'numeric', month: 'short' },
        // Month + year, e.g. "Jul 2026" (en) / "jul. de 2026" (pt-BR)
        monthYear: { month: 'short', year: 'numeric' },
        // Date + time, e.g. "Jul 3, 2026, 2:30 PM"
        dateTimeMedium: { dateStyle: 'medium', timeStyle: 'short' },
      },
    },
  }
})
