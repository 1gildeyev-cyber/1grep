import { getTranslations } from 'next-intl/server'
import { SITE } from '@/lib/site'
import { isIndexable, localizedUrl } from '@/lib/seo'
import { routing } from '@/i18n/routing'
import { cities, services } from '@/lib/content'
import { cityPath } from '@/lib/geo/city-path'
import { breadcrumbTrail } from '@/lib/breadcrumbs'
import { NOINDEX_PATHS, STATIC_PATHS } from '@/lib/matrix'

/**
 * Краткое описание сайта для языковых моделей и AI-краулеров.
 *
 * Языки, города и услуги читаются из тех же источников, что sitemap.ts
 * и переключатель города (`routing.locales`, `lib/content`) — второго
 * списка здесь не заводим, иначе он разъедется с тем, что реально есть
 * на сайте. Имена городов и услуг даны на языке по умолчанию
 * (routing.defaultLocale): это один файл на весь сайт, а не по одному
 * на каждый язык.
 */
export async function GET() {
  if (!isIndexable()) return new Response('Not found', { status: 404 })

  const t = await getTranslations({ locale: routing.defaultLocale, namespace: 'meta' })
  const description = t('site')

  const languageLines = routing.locales.map(
    (locale) => `- ${locale} — ${localizedUrl('/', locale)}`,
  )

  const cityLines = cities.map((city) => {
    const name = city.labels[routing.defaultLocale].name
    return `- ${name} — ${localizedUrl(cityPath(city.slug, '/'), routing.defaultLocale)}`
  })

  const serviceLines = services.map((service) => {
    const title = service.labels[routing.defaultLocale].title
    return `- ${title} — ${localizedUrl(`/uslugi/${service.slug}`, routing.defaultLocale)}`
  })

  // Разделы — те же STATIC_PATHS, что питают sitemap и чек-лист главной,
  // минус NOINDEX_PATHS. Своего списка здесь нет по той же причине, что
  // и у городов с услугами: он разошёлся бы с сайтом. Раньше список был
  // набран руками и рекламировал ИИ-краулерам ровно две noindex-страницы
  // (политику и оферту), не упоминая ни /uslugi, ни /kontakty.
  const nav = await getTranslations({ locale: routing.defaultLocale, namespace: 'nav' })
  const crumbs = await getTranslations({ locale: routing.defaultLocale, namespace: 'breadcrumbs' })
  const segments = { uslugi: nav('services'), kontakty: nav('contacts') }
  const sectionLines = STATIC_PATHS.filter((path) => !NOINDEX_PATHS.includes(path)).map((path) => {
    const trail = breadcrumbTrail(path, routing.defaultLocale, { home: crumbs('home'), segments })
    const label = trail[trail.length - 1].label
    return `- [${label}](${localizedUrl(path, routing.defaultLocale)})`
  })

  const body = [
    `# ${SITE.name}`,
    // Пустое описание не выводим вовсе: иначе на его месте
    // остаются две пустые строки подряд.
    ...(description ? [``, description] : []),
    ``,
    `## Контакты`,
    `- Телефон: ${SITE.primaryPhone.display}`,
    SITE.email ? `- Email: ${SITE.email}` : null,
    SITE.address.full ? `- Адрес: ${SITE.address.full}` : null,
    // Каждый блок ниже выводится только если в нём есть строки —
    // пустой заголовок без содержимого хуже отсутствующего блока.
    ...(languageLines.length > 0 ? [``, `## Языки`, ...languageLines] : []),
    ...(cityLines.length > 0 ? [``, `## Города`, ...cityLines] : []),
    ...(serviceLines.length > 0 ? [``, `## Услуги`, ...serviceLines] : []),
    ...(sectionLines.length > 0 ? [``, `## Разделы`, ...sectionLines] : []),
  ]
    .filter((line) => line !== null)
    .join('\n')

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
