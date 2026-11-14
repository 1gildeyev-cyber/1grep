import type { Locale } from '@/i18n/routing'

/**
 * Уникальный текст по паре «услуга + город». Всё необязательно:
 * страница собирается и без записи, а /seo-check перечисляет пары,
 * где текста ещё нет.
 *
 * Это единственное место, где страница услуги в одном городе может
 * отличаться от неё же в другом не подстановкой, а содержанием.
 * Чем больше пар заполнено, тем меньше риск, что поиск сочтёт их дублями.
 */
export type CityServiceText = Partial<
  Record<string, Partial<Record<string, Partial<Record<Locale, string>>>>>
>

export const cityServiceTexts: CityServiceText = {
  // 'santehnik': { 'almaty': { ru: 'Текст про сантехника именно в Алматы…' } },
}

export function cityServiceText(
  service: string,
  city: string,
  locale: Locale,
): string | undefined {
  return cityServiceTexts[service]?.[city]?.[locale]
}

/** Пары без уникального текста — для /seo-check и чек-листа главной. */
export function pairsWithoutText(
  serviceSlugs: readonly string[],
  citySlugs: readonly string[],
  locales: readonly Locale[],
): Array<{ service: string; city: string; locale: Locale }> {
  const missing: Array<{ service: string; city: string; locale: Locale }> = []
  for (const service of serviceSlugs) {
    for (const city of citySlugs) {
      for (const locale of locales) {
        if (!cityServiceText(service, city, locale)) missing.push({ service, city, locale })
      }
    }
  }
  return missing
}
