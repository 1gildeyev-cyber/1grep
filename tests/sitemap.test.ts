import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import sitemap from '@/app/sitemap'
import { logicalPaths, NOINDEX_PATHS } from '@/lib/matrix'
import { SITE, type IndexMode } from '@/lib/site'

/**
 * SITE закрыт `as const`: TS видит `indexable` как readonly, и прямое
 * `SITE.indexable = 'public'` роняет tsc TS2540 (assignment to read-only
 * property). Рантайм-объект при этом не заморожен — Object.freeze нигде
 * не вызывается, — поэтому мутация проходит через локальный каст к
 * mutable-виду того же поля. Приём только здесь, в тесте; lib/site.ts
 * не трогается и остаётся `as const`.
 */
function setIndexable(mode: IndexMode): void {
  ;(SITE as { indexable: IndexMode }).indexable = mode
}

const ORIGINAL_INDEXABLE = SITE.indexable

describe('sitemap', () => {
  afterEach(() => setIndexable(ORIGINAL_INDEXABLE))

  it('при private пустой', () => {
    setIndexable('private')
    expect(sitemap()).toEqual([])
  })

  describe('при public', () => {
    beforeEach(() => setIndexable('public'))

    it('не содержит noindex-страниц', () => {
      const urls = sitemap().map((entry) => entry.url)
      expect(urls.some((u) => u.includes('politika-konfidencialnosti'))).toBe(false)
      expect(urls.some((u) => u.includes('publichnaya-oferta'))).toBe(false)
    })

    it('содержит всю матрицу на всех языках', () => {
      // Вычитаем NOINDEX_PATHS.length, а не литерал 2: список исключаемых
      // страниц может измениться, и тест не должен ни пропустить настоящую
      // ошибку, ни упасть на правильном изменении числа исключений.
      expect(sitemap().length).toBe(
        (logicalPaths().length - NOINDEX_PATHS.length) * SITE.locales.length,
      )
    })

    it('у каждой записи есть языковые альтернативы на каждый язык сайта', () => {
      for (const entry of sitemap()) {
        for (const locale of SITE.locales) {
          expect(entry.alternates?.languages?.[locale]).toBeTruthy()
        }
      }
    })
  })
})
