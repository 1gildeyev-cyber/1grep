import { describe, expect, it } from 'vitest'
// Импорт через json-ld.tsx, а не напрямую из components/seo/local-business.tsx:
// это тот же путь, которым разметку берёт страница, поэтому заодно
// проверяется реэкспорт. Общий граф сайта — соседний `json-ld.test.ts`.
import { localBusinessGraph } from '@/components/seo/json-ld'
import type { City } from '@/lib/content'
import { localizedUrl } from '@/lib/seo'
import { SITE } from '@/lib/site'

describe('localBusinessGraph', () => {
  /**
   * Город собран здесь, а не взят из `lib/content/cities.ts`. Тест обязан
   * проверять localBusinessGraph, а не то, что города-заглушки шаблона
   * остались незаполненными: пока сюда приходил `cities[0]`, проверка
   * «без контактов филиала берёт общий телефон» держалась на том, что
   * у первого города нет `contacts` — и краснела у первого же ученика,
   * вписавшего телефон филиала в `brief.md` (это поле там есть и его
   * предлагают заполнить).
   *
   * `Labeled<CityLabels>` требует подписи на каждом языке сайта, поэтому
   * добавление языка через `/add-locale` уронит `tsc` прямо здесь —
   * так и задумано, фикстура не должна тихо остаться неполной.
   */
  const city: City = {
    slug: 'testograd',
    geo: { lat: 43.238949, lng: 76.889709 },
    labels: {
      ru: { name: 'Тестоград', in: 'в Тестограде', by: 'по Тестограду' },
      kk: { name: 'Тестоград', in: 'Тестоградта', by: 'Тестоград бойынша' },
    },
  }
  const pageUrl = localizedUrl(`/${city.slug}`, SITE.defaultLocale)
  const graph = localBusinessGraph(city, SITE.defaultLocale, pageUrl)

  it('привязан к адресу городской страницы', () => {
    expect(graph['@type']).toBe('LocalBusiness')
    expect(graph['@id']).toBe(`${pageUrl}#business`)
    expect(graph.url).toBe(pageUrl)
  })

  it('называет город словами контента на языке страницы', () => {
    for (const locale of SITE.locales) {
      const localized = localBusinessGraph(city, locale, pageUrl)
      expect(localized.name).toBe(`${SITE.name} — ${city.labels[locale].name}`)
    }
  })

  it('берёт координаты города', () => {
    expect(graph.geo).toEqual({
      '@type': 'GeoCoordinates',
      latitude: city.geo.lat,
      longitude: city.geo.lng,
    })
  })

  it('подчиняет филиал общей Organization, а не дублирует её', () => {
    expect(graph.parentOrganization).toEqual({ '@id': `${SITE.url}#organization` })
  })

  it('без поля contacts берёт общий телефон и не выдумывает пустых полей', () => {
    expect(graph.telephone).toBe(SITE.primaryPhone.raw)
    expect(graph).not.toHaveProperty('openingHours')
    expect(graph).not.toHaveProperty('hasMap')
    expect(graph.address).not.toHaveProperty('streetAddress')
  })

  it('пустая строка в контактах — это «не заполнено», а не значение', () => {
    const branch: City = { ...city, contacts: { phone: '', address: '', hours: '', mapUrl: '' } }
    const empty = localBusinessGraph(branch, SITE.defaultLocale, pageUrl)

    expect(empty.telephone).toBe(SITE.primaryPhone.raw)
    expect(empty).not.toHaveProperty('openingHours')
    expect(empty).not.toHaveProperty('hasMap')
    expect(empty.address).not.toHaveProperty('streetAddress')
    expect(JSON.stringify(empty)).not.toContain('""')
  })

  it('контакты филиала перекрывают общие', () => {
    const branch: City = {
      ...city,
      contacts: { phone: '+77010000001', address: 'ул. Тестовая, 1', hours: 'Mo-Fr 09:00-18:00' },
    }
    const withContacts = localBusinessGraph(branch, SITE.defaultLocale, pageUrl)

    expect(withContacts.telephone).toBe('+77010000001')
    expect(withContacts.openingHours).toBe('Mo-Fr 09:00-18:00')
    expect(withContacts.address).toMatchObject({ streetAddress: 'ул. Тестовая, 1' })
  })
})
