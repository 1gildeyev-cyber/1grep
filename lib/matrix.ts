import { cities, services } from '@/lib/content'
import { routing } from '@/i18n/routing'
import { cityPath } from '@/lib/geo/city-path'
import { CITY_AWARE_ROOTS } from '@/lib/geo/city-aware'

// Юридические страницы объявлены константами один раз и переиспользованы
// в STATIC_PATHS и в NOINDEX_PATHS ниже: у обеих юридических страниц
// `robots: { index: false }` (см. app/[locale]/politika-konfidencialnosti/page.tsx
// и .../publichnaya-oferta/page.tsx), поэтому в логическом дереве сайта
// они есть, а в sitemap.ts — нет. Строка адреса не должна набираться дважды.
const POLITIKA_PATH = '/politika-konfidencialnosti'
const OFERTA_PATH = '/publichnaya-oferta'

/** Логические пути вне матрицы — они есть на каждом языке по одному разу. */
export const STATIC_PATHS = ['/', '/uslugi', '/kontakty', POLITIKA_PATH, OFERTA_PATH]

/**
 * Логические пути, которых не должно быть в sitemap.xml: у них
 * `robots: { index: false }`, и Search Console помечает такой URL
 * в карте сайта ошибкой «Отправленный URL содержит тег noindex».
 * `/spasibo` того же рода — техническая страница после отправки формы —
 * но она уже не входит в logicalPaths(), поэтому здесь не перечислена.
 *
 * Источник для app/sitemap.ts и для tests/sitemap.test.ts — один и тот же
 * экспорт: длина списка используется в тесте вместо литерала, чтобы тест
 * не окаменел на числе, если исключений станет больше или меньше.
 */
export const NOINDEX_PATHS: readonly string[] = [POLITIKA_PATH, OFERTA_PATH]

/**
 * Все логические пути сайта без языкового префикса.
 * Один источник для sitemap, чек-листа главной и /seo-check —
 * чтобы карта сайта не могла разойтись с тем, что реально собралось.
 *
 * Городские версии строятся по `CITY_AWARE_ROOTS` — тому же списку,
 * которым `lib/geo/parse-path.ts` решает, city-aware ли адрес. Список
 * один на двоих (см. `lib/geo/city-aware.ts`), поэтому «/uslugi» здесь
 * не могут разойтись с тем, что считает city-aware переключатель города.
 * Вложенность услуг под «uslugi» (сам список услуг) специфична для этого
 * единственного корня и остаётся явной: обобщать её ради одного корня
 * было бы лишним усложнением.
 */
export function logicalPaths(): string[] {
  const paths = [...STATIC_PATHS]

  for (const service of services) paths.push(`/uslugi/${service.slug}`)

  for (const city of cities) {
    paths.push(cityPath(city.slug, '/'))
    for (const root of CITY_AWARE_ROOTS) {
      paths.push(cityPath(city.slug, `/${root}`))
    }
    for (const service of services) {
      paths.push(cityPath(city.slug, `/uslugi/${service.slug}`))
    }
  }

  return paths
}

/** Сколько страниц соберётся: логические пути × языки. */
export function matrixSize(): number {
  return logicalPaths().length * routing.locales.length
}
