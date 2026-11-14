import type { CityLabels, Labeled } from './types'

export type City = {
  slug: string
  geo: { lat: number; lng: number }
  /** Контакты филиала. Пусто — берутся общие из SITE. */
  contacts?: { phone?: string; address?: string; hours?: string; mapUrl?: string }
  labels: Labeled<CityLabels>
}

/**
 * Города сайта. Два города-заглушки приехали в шаблоне, чтобы матрица
 * была видна сразу; guard-тест держит `pnpm test` красным, пока они здесь.
 * Падежи нужны для заголовков: «Сантехник в Алматы», «Выезд по Алматы».
 */
export const cities = [
  {
    slug: 'gorod-odin',
    geo: { lat: 43.238949, lng: 76.889709 },
    labels: {
      ru: { name: 'Город Один', in: 'в Городе Один', by: 'по Городу Один' },
      kk: { name: 'Бірінші Қала', in: 'Бірінші Қалада', by: 'Бірінші Қала бойынша' },
    },
  },
  {
    slug: 'gorod-dva',
    geo: { lat: 51.128207, lng: 71.430429 },
    labels: {
      ru: { name: 'Город Два', in: 'в Городе Два', by: 'по Городу Два' },
      kk: { name: 'Екінші Қала', in: 'Екінші Қалада', by: 'Екінші Қала бойынша' },
    },
  },
] as const satisfies readonly City[]

export type CitySlug = (typeof cities)[number]['slug']

/**
 * `cities` — кортеж записей с литеральными типами (у каждой записи `slug` —
 * не `string`, а конкретная строка-литерал), а не `City[]`: `as const satisfies`
 * не расширяет литералы до `City`, иначе
 * `CitySlug` выродился бы в `string`. `.find()` на таком кортеже TypeScript
 * типизирует результат как объединение элементов кортежа, что структурно
 * совместимо с `City` (те же поля, литералы — частный случай `string`),
 * поэтому явный каст не нужен: сигнатура `City | undefined` держится сама.
 */
export function findCity(slug: string): City | undefined {
  return cities.find((city) => city.slug === slug)
}
