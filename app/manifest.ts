import type { MetadataRoute } from 'next'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { SITE } from '@/lib/site'

/**
 * Манифест у сайта один на все языки — адрес `/manifest.webmanifest`
 * языкового сегмента не имеет. Поэтому описание берётся на языке
 * по умолчанию, ровно как имена городов и услуг в llms.txt.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: 'meta' })

  return {
    name: SITE.name,
    short_name: SITE.name,
    description: t('site') || undefined,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
  }
}
