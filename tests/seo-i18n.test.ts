import { describe, expect, it } from 'vitest'
import type { Metadata } from 'next'
import { logicalPaths } from '@/lib/matrix'
import { localizedUrl, pageMeta } from '@/lib/seo'
import { SITE } from '@/lib/site'

/**
 * Languages<T> в типах Next — набор НЕОБЯЗАТЕЛЬНЫХ ключей-литералов
 * hreflang, а `?? {}` добавляет к нему пустой объект, у которого таких
 * ключей нет вовсе. Читаем таблицу как обычный словарь строк: тест
 * сверяет значения, а не типы. Расширение локальное — экспортируемые
 * типы остаются литеральными.
 */
function languagesOf(meta: Metadata): Record<string, string> {
  return (meta.alternates?.languages ?? {}) as Record<string, string>
}

/** Регион для og:locale общий у всего сайта: 'ru_KZ' → 'KZ'. */
const REGION = SITE.locale.split('_')[1]

describe('языковые адреса', () => {
  it('основной язык живёт без префикса', () => {
    expect(localizedUrl('/uslugi', SITE.defaultLocale)).toBe(`${SITE.url}/uslugi`)
  })

  it('неосновной язык получает префикс', () => {
    const other = SITE.locales.find((locale) => locale !== SITE.defaultLocale)!
    expect(localizedUrl('/uslugi', other)).toBe(`${SITE.url}/${other}/uslugi`)
  })

  it('корень не превращается в адрес с хвостовым слешем', () => {
    expect(localizedUrl('/', SITE.defaultLocale)).toBe(SITE.url)
  })

  it('корень неосновного языка — это адрес языка, а не сайта', () => {
    const other = SITE.locales.find((locale) => locale !== SITE.defaultLocale)!
    expect(localizedUrl('/', other)).toBe(`${SITE.url}/${other}`)
  })

  it('canonical и og:url совпадают на каждом языке', () => {
    for (const locale of SITE.locales) {
      const meta = pageMeta('/uslugi', locale)
      expect(meta.openGraph?.url).toBe(meta.alternates?.canonical)
    }
  })

  /**
   * Дефект, ради которого у pageMeta появился второй параметр: с одним
   * аргументом казахская страница объявляла каноническим адресом русскую
   * и вычёркивала себя из индекса.
   */
  it('canonical неосновного языка ведёт на страницу этого языка', () => {
    for (const locale of SITE.locales) {
      if (locale === SITE.defaultLocale) continue
      expect(pageMeta('/spasibo', locale).alternates?.canonical).toBe(
        `${SITE.url}/${locale}/spasibo`,
      )
    }
  })

  it('hreflang содержит все языки и x-default', () => {
    const languages = languagesOf(pageMeta('/uslugi', SITE.defaultLocale))
    for (const locale of SITE.locales) expect(languages[locale]).toBeTruthy()
    expect(languages['x-default']).toBe(localizedUrl('/uslugi', SITE.defaultLocale))
  })

  it('hreflang каждого языка указывает на адрес этого языка', () => {
    const languages = languagesOf(pageMeta('/uslugi', SITE.defaultLocale))
    for (const locale of SITE.locales) {
      expect(languages[locale]).toBe(localizedUrl('/uslugi', locale))
    }
  })

  it('og:locale соответствует языку страницы, а не языку сайта', () => {
    for (const locale of SITE.locales) {
      expect(pageMeta('/uslugi', locale).openGraph?.locale).toBe(`${locale}_${REGION}`)
    }
  })

  it('og:locale:alternate перечисляет остальные языки и не пустует', () => {
    for (const locale of SITE.locales) {
      const alternate = pageMeta('/uslugi', locale).openGraph?.alternateLocale
      expect(alternate).toEqual(
        SITE.locales.filter((other) => other !== locale).map((other) => `${other}_${REGION}`),
      )
    }
  })

  /**
   * Картинку главной рисует Next из app/[locale]/opengraph-image.tsx —
   * со всеми размерами, alt, типом и хешем. Отдай ей images руками,
   * и весь этот набор пропадёт. Главная есть на КАЖДОМ языке, поэтому
   * условие смотрит на логический путь, а не на готовый адрес.
   */
  it('корень не получает картинку ни на одном языке, остальные пути получают', () => {
    for (const locale of SITE.locales) {
      expect(pageMeta('/', locale).openGraph?.images).toBeUndefined()
      expect(pageMeta('/uslugi', locale).openGraph?.images).toBeTruthy()
    }
  })
})

/**
 * Самая дорогая ошибка этого слоя — расхождение адресов на одной странице.
 * Поэтому проверка гоняется не на одном пути, а на всей матрице сайта
 * (lib/matrix.ts) в обоих языках.
 */
describe('вся матрица: адреса не расходятся', () => {
  const paths = logicalPaths()

  it('canonical, og:url и собственный hreflang — один и тот же адрес', () => {
    for (const path of paths) {
      for (const locale of SITE.locales) {
        const meta = pageMeta(path, locale)
        const url = localizedUrl(path, locale)
        expect(meta.alternates?.canonical, `canonical на ${path} (${locale})`).toBe(url)
        expect(meta.openGraph?.url, `og:url на ${path} (${locale})`).toBe(url)
        expect(languagesOf(meta)[locale], `hreflang ${locale} на ${path}`).toBe(url)
      }
    }
  })

  it('hreflang ведёт только на страницы, которые есть в матрице', () => {
    const known = new Set(
      paths.flatMap((path) => SITE.locales.map((locale) => localizedUrl(path, locale))),
    )

    for (const path of paths) {
      for (const locale of SITE.locales) {
        for (const [hreflang, url] of Object.entries(languagesOf(pageMeta(path, locale)))) {
          expect(known.has(url), `${hreflang} на ${path} ведёт на ${url} вне матрицы`).toBe(true)
        }
      }
    }
  })
})
