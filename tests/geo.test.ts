import { describe, expect, it } from 'vitest'
import { cityPath } from '@/lib/geo/city-path'
import { parsePath } from '@/lib/geo/parse-path'
import { SITE } from '@/lib/site'

// Вымышленные слаги здесь читаются нагляднее настоящих — реальные проверяет
// тест согласованности в tests/matrix.test.ts.
const CITIES = ['almaty', 'astana']

describe('cityPath', () => {
  it('корень превращает в адрес города', () => {
    expect(cityPath('almaty', '/')).toBe('/almaty')
  })
  it('вложенный путь получает город впереди', () => {
    expect(cityPath('almaty', '/uslugi/santehnik')).toBe('/almaty/uslugi/santehnik')
  })
  it('без города возвращает путь как есть', () => {
    expect(cityPath(null, '/uslugi')).toBe('/uslugi')
  })
})

// «Основной язык» здесь — SITE.defaultLocale, а не буквально 'ru':
// порядок языков настраивается (первый в SITE.locales и есть основной,
// его переставляет `/brand-init`), и тест обязан пережить перестановку.
describe('parsePath', () => {
  it('корень основного языка', () => {
    expect(parsePath('/', CITIES))
      .toMatchObject({ locale: SITE.defaultLocale, city: null, logical: '/', cityAware: true })
  })
  it('город на основном языке', () => {
    expect(parsePath('/almaty/uslugi/santehnik', CITIES))
      .toMatchObject({ locale: SITE.defaultLocale, city: 'almaty', logical: '/uslugi/santehnik', cityAware: true })
  })
  it('язык и город вместе', () => {
    expect(parsePath('/kk/almaty/uslugi', CITIES))
      .toMatchObject({ locale: 'kk', city: 'almaty', logical: '/uslugi', cityAware: true })
  })
  it('обычная страница не городская', () => {
    expect(parsePath('/kontakty', CITIES))
      .toMatchObject({ city: null, logical: '/kontakty', cityAware: false })
  })
  it('чужой первый сегмент не принимается за город', () => {
    expect(parsePath('/kontakty', CITIES).city).toBeNull()
  })
  it('слово, похожее на язык, но не язык, остаётся частью пути', () => {
    expect(parsePath('/english/uslugi', CITIES))
      .toMatchObject({ locale: SITE.defaultLocale, logical: '/english/uslugi' })
  })
})
