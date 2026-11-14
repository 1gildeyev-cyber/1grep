'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { Locale } from '@/i18n/routing'
import { cities } from '@/lib/content'
import { ALL_CITIES, useCityNavigate } from './use-city-navigate'

const CITY_SLUGS = cities.map((city) => city.slug)

/**
 * Переключатель города. Обычный <select> без единого класса оформления —
 * автор сайта одевает его сам. Пункт на каждый город плюс «Весь Казахстан»
 * (общая версия без привязки к городу).
 *
 * Вся логика перехода — в useCityNavigate: этот компонент только
 * отображает список и передаёт выбор дальше.
 */
export function CitySwitcher() {
  const t = useTranslations('city')
  // useLocale() типизирован как string (глобальной аугментации Locale
  // в проекте нет) — расширяем явно, как и в lib/geo/parse-path.ts,
  // чтобы индексировать city.labels[locale].
  const locale = useLocale() as Locale
  const { changeCity, activeSlug } = useCityNavigate(CITY_SLUGS)

  return (
    <select
      aria-label={t('switch')}
      value={activeSlug ?? ALL_CITIES}
      onChange={(event) => changeCity(event.target.value)}
    >
      <option value={ALL_CITIES}>{t('all')}</option>
      {cities.map((city) => (
        <option key={city.slug} value={city.slug}>
          {city.labels[locale].name}
        </option>
      ))}
    </select>
  )
}
