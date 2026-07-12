import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'pt-BR', 'fr', 'es-419'],
  defaultLocale: 'en',
  localeCookie: true,
})
