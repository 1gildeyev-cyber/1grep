import type { Locale } from '@/i18n/routing'
import { findCity, findService } from '@/lib/content'
import { localizedUrl } from '@/lib/seo'

export type Crumb = { path: string; label: string }

/**
 * Логика крошек живёт отдельно от их разметки (components/seo/breadcrumbs.tsx)
 * по той же причине, по какой отдельно живёт lib/geo: сам компонент тянет
 * <Link> из next-intl, а тот — клиентскую навигацию Next, которую тесты
 * в окружении node не импортируют. Чистая функция проверяется тестом,
 * компонент остаётся тонким.
 */

/**
 * Подпись сегмента адреса. Города и услуги называет сам контент —
 * значит, крошка не может разойтись с тем, что написано на странице.
 * Города проверяются раньше услуг: при совпадении слагов выигрывает город,
 * потому что в адресе он стоит первым сегментом.
 * Всё остальное («uslugi», «kontakty») называет страница через `segments`:
 * текста в компонентах и в lib не держим, он живёт в messages/.
 */
function segmentLabel(segment: string, locale: Locale, segments: Record<string, string>): string {
  const city = findCity(segment)
  if (city) return city.labels[locale].name

  const service = findService(segment)
  if (service) return service.labels[locale].title

  // Слаг вместо подписи виден сразу — молча пустой крошки не будет.
  return segments[segment] ?? segment
}

/**
 * Цепочка крошек из логического пути (без языка, но с городом):
 * '/almaty/uslugi/santehnik' → Главная → Алматы → Услуги → Сантехник.
 *
 * Путь режется по сегментам, и каждая крошка — накопленный префикс,
 * поэтому вести цепочку руками не нужно и разойтись с адресом она
 * не может. Все её звенья — существующие страницы матрицы: городской
 * префикс сохраняется на каждом шаге.
 */
export function breadcrumbTrail(
  logicalPath: string,
  locale: Locale,
  { home, segments = {} }: { home: string; segments?: Record<string, string> },
): Crumb[] {
  const trail: Crumb[] = [{ path: '/', label: home }]

  let accumulated = ''
  for (const segment of logicalPath.split('/').filter(Boolean)) {
    accumulated += `/${segment}`
    trail.push({ path: accumulated, label: segmentLabel(segment, locale, segments) })
  }

  return trail
}

/** BreadcrumbList из той же цепочки: разметка и видимый текст не разъедутся. */
export function breadcrumbGraph(trail: Crumb[], locale: Locale): Record<string, unknown> {
  const pageUrl = localizedUrl(trail[trail.length - 1].path, locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumbs`,
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: localizedUrl(crumb.path, locale),
    })),
  }
}
