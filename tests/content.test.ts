import { describe, expect, it } from 'vitest'
import { cities, findCity } from '@/lib/content/cities'
import { services, findService } from '@/lib/content/services'
import { cityServiceText, cityServiceTexts, pairsWithoutText } from '@/lib/content/city-service'
import { SITE } from '@/lib/site'

describe('города', () => {
  it('у каждого города есть подписи на каждом языке сайта', () => {
    for (const city of cities) {
      for (const locale of SITE.locales) {
        expect(city.labels[locale], `нет подписей ${locale} у ${city.slug}`).toBeTruthy()
        expect(city.labels[locale].in).not.toBe('')
        expect(city.labels[locale].by).not.toBe('')
      }
    }
  })

  it('слаги уникальны', () => {
    const slugs = cities.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('находит город по слагу и не находит чужой', () => {
    expect(findCity(cities[0].slug)?.slug).toBe(cities[0].slug)
    expect(findCity('takogo-goroda-net')).toBeUndefined()
  })
})

describe('услуги', () => {
  it('у каждой услуги есть подписи на каждом языке', () => {
    for (const service of services) {
      for (const locale of SITE.locales) {
        expect(service.labels[locale], `нет подписей ${locale} у ${service.slug}`).toBeTruthy()
        expect(service.labels[locale].title).not.toBe('')
        expect(service.labels[locale].short).not.toBe('')
        expect(service.labels[locale].body).not.toBe('')
      }
    }
  })

  it('слаги уникальны и не пересекаются со слагами городов', () => {
    // Явная аннотация `string[]` расширяет литеральные типы слагов
    // (`'usluga-odna' | 'usluga-dva'`, `'gorod-odin' | 'gorod-dva'`):
    // без неё `citySlugs.includes(s)` не компилируется — TS2345, слаги
    // услуг и городов это разные литеральные объединения.
    const serviceSlugs: string[] = services.map((s) => s.slug)
    const citySlugs: string[] = cities.map((c) => c.slug)
    expect(new Set(serviceSlugs).size).toBe(serviceSlugs.length)
    expect(serviceSlugs.filter((s) => citySlugs.includes(s))).toEqual([])
  })

  it('находит услугу по слагу и не находит чужую', () => {
    expect(findService(services[0].slug)?.slug).toBe(services[0].slug)
    expect(findService('takoy-uslugi-net')).toBeUndefined()
  })
})

describe('тексты пар «услуга + город»', () => {
  it('отсутствующий текст возвращает undefined, а не пустую строку', () => {
    expect(
      cityServiceText('takoy-uslugi-net', 'takogo-goroda-net', SITE.defaultLocale),
    ).toBeUndefined()
  })

  /**
   * Не сверяем количество пропущенных пар с формулой
   * `services.length * cities.length * SITE.locales.length`: как только
   * ученик заполнит хотя бы одну пару, эта формула перестанет совпадать
   * и тест придётся вручную чинить, хотя поведение функции не сломано.
   * Вместо этого сверяем каждую пару из реальной матрицы напрямую
   * с содержимым `cityServiceTexts` — тест остаётся верным при любом
   * состоянии объекта, пустом или частично заполненном.
   */
  it('пропущены ровно те пары, для которых в cityServiceTexts нет записи', () => {
    const serviceSlugs = services.map((s) => s.slug)
    const citySlugs = cities.map((c) => c.slug)
    const missing = pairsWithoutText(serviceSlugs, citySlugs, SITE.locales)
    const missingKeys = new Set(missing.map((p) => `${p.service}|${p.city}|${p.locale}`))

    for (const service of serviceSlugs) {
      for (const city of citySlugs) {
        for (const locale of SITE.locales) {
          const hasText = cityServiceTexts[service]?.[city]?.[locale] !== undefined
          const key = `${service}|${city}|${locale}`
          expect(missingKeys.has(key), `пара ${key}: ожидали "пропущена" = ${!hasText}`).toBe(
            !hasText,
          )
        }
      }
    }
  })

  /**
   * Поведенческое доказательство того же самого свойства: берём слаги,
   * которых нет в реальном контенте (не пересекутся с тем, что впишет
   * ученик), проверяем, что пара пропущена без записи и перестаёт быть
   * пропущенной сразу после того, как запись появляется.
   */
  it('пара пропадает из списка пропущенных, как только для неё появляется текст', () => {
    const service = 'test-service-xyz'
    const city = 'test-city-xyz'
    const locale = SITE.defaultLocale

    expect(pairsWithoutText([service], [city], [locale])).toEqual([{ service, city, locale }])

    cityServiceTexts[service] = { [city]: { [locale]: 'тестовый текст пары' } }
    try {
      expect(cityServiceText(service, city, locale)).toBe('тестовый текст пары')
      expect(pairsWithoutText([service], [city], [locale])).toEqual([])
    } finally {
      delete cityServiceTexts[service]
    }
  })

  /**
   * Ключи cityServiceTexts — обычные строки (см. бриф задачи), а не
   * литеральные типы слагов: три уровня литералов дают нечитаемые ошибки
   * tsc. Эта пара тестов — единственная защита от опечатки в ключе:
   * без неё текст, вписанный под несуществующий слаг, молча нигде
   * не появится, и никто об этом не узнает.
   */
  it('ключи первого уровня — реальные слаги услуг', () => {
    // Set<string>, не Set<'usluga-odna' | 'usluga-dva'>: .has() иначе
    // не принимает произвольный ключ объекта (тот всегда string).
    const serviceSlugs = new Set<string>(services.map((s) => s.slug))
    for (const key of Object.keys(cityServiceTexts)) {
      expect(serviceSlugs.has(key), `"${key}" не совпадает ни с одним слагом услуги`).toBe(true)
    }
  })

  it('ключи второго уровня — реальные слаги городов', () => {
    const citySlugs = new Set<string>(cities.map((c) => c.slug))
    for (const byCity of Object.values(cityServiceTexts)) {
      for (const key of Object.keys(byCity ?? {})) {
        expect(citySlugs.has(key), `"${key}" не совпадает ни с одним слагом города`).toBe(true)
      }
    }
  })
})
