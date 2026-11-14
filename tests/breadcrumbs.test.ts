import { describe, expect, it } from 'vitest'
import { breadcrumbGraph, breadcrumbTrail } from '@/lib/breadcrumbs'
import { cities, services } from '@/lib/content'
import { logicalPaths } from '@/lib/matrix'
import { localizedUrl } from '@/lib/seo'
import { SITE } from '@/lib/site'

describe('крошки', () => {
  const [city] = cities
  const [service] = services
  const labels = { home: 'Главная', segments: { uslugi: 'Услуги' } }

  it('на главной цепочки нет', () => {
    expect(breadcrumbTrail('/', SITE.defaultLocale, labels)).toHaveLength(1)
  })

  it('выводится из пути и заканчивается самой страницей', () => {
    const path = `/${city.slug}/uslugi/${service.slug}`
    const trail = breadcrumbTrail(path, SITE.defaultLocale, labels)

    expect(trail.map((crumb) => crumb.path)).toEqual([
      '/',
      `/${city.slug}`,
      `/${city.slug}/uslugi`,
      path,
    ])
  })

  it('называет город и услугу словами контента на языке страницы', () => {
    for (const locale of SITE.locales) {
      const trail = breadcrumbTrail(`/${city.slug}/uslugi/${service.slug}`, locale, labels)
      expect(trail[1].label).toBe(city.labels[locale].name)
      expect(trail[2].label).toBe('Услуги')
      expect(trail[3].label).toBe(service.labels[locale].title)
    }
  })

  it('каждое звено — существующая страница матрицы', () => {
    const paths = logicalPaths()

    for (const path of paths) {
      for (const crumb of breadcrumbTrail(path, SITE.defaultLocale, labels)) {
        expect(paths, `крошка ${crumb.path} со страницы ${path}`).toContain(crumb.path)
      }
    }
  })

  it('BreadcrumbList повторяет видимую цепочку звено в звено', () => {
    const path = `/${city.slug}/uslugi`
    const trail = breadcrumbTrail(path, 'kk', labels)
    const graph = breadcrumbGraph(trail, 'kk')
    const items = graph.itemListElement as Array<Record<string, unknown>>

    expect(graph['@type']).toBe('BreadcrumbList')
    expect(items).toHaveLength(trail.length)
    items.forEach((item, index) => {
      expect(item.position).toBe(index + 1)
      expect(item.name).toBe(trail[index].label)
      expect(item.item).toBe(localizedUrl(trail[index].path, 'kk'))
    })
  })
})
