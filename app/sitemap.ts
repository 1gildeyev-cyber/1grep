import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { logicalPaths, NOINDEX_PATHS } from '@/lib/matrix'
import { isIndexable, LAST_UPDATED, localizedUrl } from '@/lib/seo'

/**
 * Карта сайта строится обходом logicalPaths() — того же перечисления
 * матрицы, которое питает чек-лист главной (app/[locale]/page.tsx) и
 * будущий /seo-check. Собственного списка адресов здесь нет и не должно
 * быть: две независимые копии списка страниц неизбежно разъедутся, и
 * sitemap пообещает поисковику страницы, которых на сайте нет — либо
 * скроет от него страницы, которые есть.
 *
 * NOINDEX_PATHS (lib/matrix.ts) вычёркивает юридические страницы: у них
 * `robots: { index: false }`, и присутствие такого URL в sitemap.xml
 * Search Console отмечает ошибкой «Отправленный URL содержит тег noindex».
 *
 * Каждая логическая страница разворачивается на каждый язык через
 * localizedUrl — тот же помощник, что расставляет canonical и hreflang
 * в lib/seo.ts, поэтому адреса здесь не могут разойтись с реальными
 * адресами страниц. alternates.languages у каждой записи перечисляет
 * ВСЕ языки (включая её собственный) плюс x-default — ровно тот же набор,
 * что pageMeta кладёт в HTML. Два источника hreflang обязаны говорить
 * одно и то же: разойдясь, они дают поисковику противоречивый сигнал
 * о том, какая версия страницы главная.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexable()) return []

  return logicalPaths()
    .filter((path) => !NOINDEX_PATHS.includes(path))
    .flatMap((path) =>
      routing.locales.map((locale) => ({
        url: localizedUrl(path, locale),
        lastModified: LAST_UPDATED,
        changeFrequency: 'monthly' as const,
        priority: path === '/' ? 1 : 0.5,
        alternates: {
          languages: {
            ...Object.fromEntries(
              routing.locales.map((other) => [other, localizedUrl(path, other)]),
            ),
            'x-default': localizedUrl(path, routing.defaultLocale),
          },
        },
      })),
    )
}
