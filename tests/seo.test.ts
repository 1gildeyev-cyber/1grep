import { describe, expect, it } from 'vitest'
import { absoluteUrl, ogLocale, pageMeta } from '@/lib/seo'
import { routing } from '@/i18n/routing'
import { SITE } from '@/lib/site'
import ru from '@/messages/ru.json'
import kk from '@/messages/kk.json'

describe('absoluteUrl', () => {
  it('склеивает путь с доменом', () => {
    expect(absoluteUrl('/uslugi')).toBe(`${SITE.url}/uslugi`)
  })

  it('срезает хвостовой слеш', () => {
    expect(absoluteUrl('/uslugi/')).toBe(`${SITE.url}/uslugi`)
  })

  it('корень отдаёт без слеша на конце', () => {
    expect(absoluteUrl('/')).toBe(SITE.url)
  })

  it('добавляет ведущий слеш, если его забыли', () => {
    expect(absoluteUrl('kontakty')).toBe(`${SITE.url}/kontakty`)
  })
})

describe('pageMeta: описание страницы', () => {
  it('без третьего аргумента не выводит description вовсе', () => {
    const meta = pageMeta('/uslugi', routing.defaultLocale)
    expect(meta.description).toBeUndefined()
    expect(meta.openGraph?.description).toBeUndefined()
  })

  it('пустую строку считает отсутствующим описанием', () => {
    const meta = pageMeta('/uslugi', routing.defaultLocale, '')
    expect(meta.description).toBeUndefined()
    expect(meta.openGraph?.description).toBeUndefined()
  })

  // Врозь их разносить нельзя: объект openGraph страницы затирает
  // layout'овский целиком, и страница с одним только `description`
  // осталась бы с og:description от всего сайта.
  it('ставит description и og:description одной и той же строкой', () => {
    const text = 'Описание конкретной страницы'
    const meta = pageMeta('/uslugi', routing.defaultLocale, text)
    expect(meta.description).toBe(text)
    expect(meta.openGraph?.description).toBe(text)
  })

  it('не теряет общие поля openGraph, когда описание задано', () => {
    const meta = pageMeta('/uslugi', routing.defaultLocale, 'Текст')
    expect(meta.openGraph?.siteName).toBe(SITE.name)
    expect(meta.openGraph?.locale).toBe(ogLocale(routing.defaultLocale))
  })
})

// Описание сайта обязано быть у КАЖДОГО языка своим ключом, а не одной
// строкой в конфиге: иначе русский текст уезжает на казахские страницы.
describe('описание сайта — по языкам', () => {
  it('ключ meta.site есть в словаре каждого языка', () => {
    for (const locale of SITE.locales) {
      const messages = locale === 'ru' ? ru : kk
      expect(messages.meta?.site, `нет meta.site в messages/${locale}.json`).toBeDefined()
    }
  })

  it('в lib/site.ts описания больше нет', () => {
    expect('description' in SITE).toBe(false)
  })
})
