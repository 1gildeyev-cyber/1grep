import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/routing'
import { CITY_AWARE_ROOTS } from './city-aware'

export type ParsedPath = {
  locale: Locale
  /** Город из адреса или null, если адрес общий. */
  city: string | null
  /** Путь без языка и города, всегда начинается со слеша. */
  logical: string
  /** Городская ли страница: только для неё имеет смысл менять город в адресе. */
  cityAware: boolean
}

/**
 * Это сердце переключателя города: разбирает любой адрес на три части,
 * чтобы подменить только одну.
 *
 * `CITY_AWARE_ROOTS` — общий с `lib/matrix.ts` список (см. `city-aware.ts`),
 * а не своя копия: иначе список городских корней здесь и в перечислении
 * матрицы могли бы разойтись незаметно.
 */
export function parsePath(pathname: string, citySlugs: readonly string[]): ParsedPath {
  const parts = pathname.split('/').filter(Boolean)

  // При localePrefix 'as-needed' основной язык префикса не имеет,
  // поэтому первый сегмент — язык только если он есть в списке языков.
  const first = parts[0]
  const hasLocalePrefix = !!first && (routing.locales as readonly string[]).includes(first)
  const locale = (hasLocalePrefix ? first : routing.defaultLocale) as Locale

  let rest = hasLocalePrefix ? parts.slice(1) : parts
  const city = rest[0] && citySlugs.includes(rest[0]) ? rest[0] : null
  if (city) rest = rest.slice(1)

  const logical = rest.length ? `/${rest.join('/')}` : '/'
  const cityAware = rest.length === 0 || CITY_AWARE_ROOTS.includes(rest[0])

  return { locale, city, logical, cityAware }
}
