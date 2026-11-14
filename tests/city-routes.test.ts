import { describe, expect, it } from 'vitest'
import { cities } from '@/lib/content'
import { logicalPaths } from '@/lib/matrix'
import { SITE } from '@/lib/site'

/**
 * Адреса, которые обязаны оставаться обычными страницами. `[city]` стоит
 * на одном уровне с ними в дереве маршрутов: Next разрешает статические
 * сегменты раньше динамических, но слаг города не должен даже теоретически
 * совпасть с одним из этих имён — иначе на статику надеяться не на что.
 */
const RESERVED = [
  'uslugi',
  'kontakty',
  'politika-konfidencialnosti',
  'publichnaya-oferta',
  'spasibo',
]

describe('городские маршруты', () => {
  it('слаг города не совпадает с зарезервированным адресом', () => {
    for (const city of cities) {
      expect(RESERVED, `город ${city.slug} перехватит обычную страницу`).not.toContain(city.slug)
    }
  })

  it('слаг города не совпадает с кодом языка', () => {
    // SITE.locales — `readonly ['ru', 'kk']` (литеральный кортеж из `as const`
    // в lib/site.ts): без явного расширения до `readonly string[]` toContain
    // принимает только 'ru' | 'kk', а city.slug — другой литеральный союз
    // ('gorod-odin' | 'gorod-dva'), и tsc падает TS2345 на несовместимости
    // аргументов. Каст — только здесь, в самом тесте.
    for (const city of cities) {
      expect(SITE.locales as readonly string[]).not.toContain(city.slug)
    }
  })

  it('каждый городской путь есть в матрице', () => {
    const paths = logicalPaths()
    for (const city of cities) expect(paths).toContain(`/${city.slug}`)
  })
})
