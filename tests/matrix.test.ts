import { describe, expect, it } from 'vitest'
import { logicalPaths, matrixSize } from '@/lib/matrix'
import { cities, services } from '@/lib/content'
import { SITE } from '@/lib/site'
import { parsePath } from '@/lib/geo/parse-path'
import { cityPath } from '@/lib/geo/city-path'

describe('матрица', () => {
  it('содержит городскую версию каждой услуги', () => {
    const paths = logicalPaths()
    for (const city of cities) {
      for (const service of services) {
        expect(paths).toContain(`/${city.slug}/uslugi/${service.slug}`)
      }
    }
  })

  it('содержит общую версию каждой услуги', () => {
    const paths = logicalPaths()
    for (const service of services) expect(paths).toContain(`/uslugi/${service.slug}`)
  })

  it('не содержит повторов', () => {
    const paths = logicalPaths()
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('размер считается по языкам', () => {
    expect(matrixSize()).toBe(logicalPaths().length * SITE.locales.length)
  })
})

/**
 * Самый ценный тест задачи: `parsePath` (lib/geo/parse-path.ts) и
 * `logicalPaths` (lib/matrix.ts) читают один и тот же список городских
 * корней из lib/geo/city-aware.ts, но это не гарантирует, что их
 * *поведение* не разойдётся при будущей правке одного из файлов —
 * например, если кто-то поменяет условие `cityAware` в parsePath,
 * забыв, что logicalPaths строит городские версии по другому правилу.
 *
 * Тест гоняет на настоящих данных проекта (gorod-odin, gorod-dva,
 * usluga-odna, usluga-dva), а не на вымышленных almaty/astana из
 * tests/geo.test.ts — расхождение должно ловиться на реальной матрице,
 * которую увидит ученик, а не на примере из брифа.
 *
 * Проверяет оба направления:
 *  1. Каждый логический путь, который parsePath считает городским
 *     (cityAware === true), обязан иметь городскую версию в logicalPaths()
 *     для каждого города — иначе переключатель города уведёт на 404.
 *  2. Каждая городская страница из logicalPaths() обязана разбираться
 *     parsePath как city-aware, с правильным city и logical, и этот
 *     logical обязан сам присутствовать в logicalPaths() как общая
 *     версия — иначе sitemap пообещает поисковику страницу, которую
 *     переключатель города не покажет.
 */
describe('согласованность parsePath и logicalPaths (единый список городских корней)', () => {
  // CitySlug — литеральный union ('gorod-odin' | 'gorod-dva'), а не string:
  // расширяем тип явно, как предписывает CLAUDE.md для полей SITE и как
  // уже сделано в tests/content.test.ts для слагов городов и услуг — иначе
  // `.includes()` на произвольной строке ниже не компилируется (TS2345).
  const citySlugs: string[] = cities.map((c) => c.slug)

  it('каждый city-aware логический путь имеет городскую версию для каждого города, и наоборот', () => {
    const paths = logicalPaths()
    const nonCityPaths = paths.filter((path) => {
      const first = path.split('/').filter(Boolean)[0] ?? ''
      return !citySlugs.includes(first)
    })

    for (const path of nonCityPaths) {
      const { cityAware } = parsePath(path, citySlugs)
      for (const city of cities) {
        const cityVersion = cityPath(city.slug, path)
        expect(
          paths.includes(cityVersion),
          cityAware
            ? `parsePath считает "${path}" городским, но "${cityVersion}" нет в logicalPaths()`
            : `parsePath считает "${path}" НЕ городским, но "${cityVersion}" есть в logicalPaths()`,
        ).toBe(cityAware)
      }
    }
  })

  it('каждая городская страница матрицы разбирается как city-aware, с правильным городом и уже присутствующей общей версией', () => {
    const paths = logicalPaths()

    for (const path of paths) {
      const first = path.split('/').filter(Boolean)[0] ?? ''
      if (!citySlugs.includes(first)) continue

      const parsed = parsePath(path, citySlugs)
      expect(parsed.city, `"${path}" должен разобраться с городом "${first}"`).toBe(first)
      expect(parsed.cityAware, `"${path}" разобран как не city-aware`).toBe(true)
      expect(paths, `общая версия "${parsed.logical}" должна быть в logicalPaths()`).toContain(
        parsed.logical,
      )
    }
  })
})
