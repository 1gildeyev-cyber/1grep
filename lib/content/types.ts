import type { Locale } from '@/i18n/routing'

/**
 * Значение на каждом языке сайта. Ключ обязателен для всех языков:
 * забытый перевод должен ронять `pnpm lint`, а не показываться
 * пользователю пустой строкой.
 */
export type Labeled<T> = Record<Locale, T>

export type CityLabels = {
  /** Именительный: «Алматы» */
  name: string
  /** Предложный с предлогом: «в Алматы», «Алматыда» */
  in: string
  /** Дательный с предлогом: «по Алматы», «Алматы бойынша» */
  by: string
}

export type ServiceLabels = {
  title: string
  /** Одна строка для карточек и описаний. */
  short: string
  /** Текст страницы услуги. */
  body: string
}
