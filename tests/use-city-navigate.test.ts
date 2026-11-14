import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * useCityNavigate вызывает useRouter/usePathname из i18n/navigation —
 * подменяем модуль плоскими функциями-заглушками (vi.mock хостится
 * над импортами автоматически).
 */
const push = vi.fn()
let currentPathname = '/almaty/uslugi/santehnik'

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => currentPathname,
}))

/**
 * useState подменён тоже — и это осознанная подмена, а не обход
 * неудобства. Тест проверяет решения хука (куда вести и что показать
 * в списке), а не то, что React перерисовал `<select>`; ради последнего
 * пришлось бы тащить в проект рендерер и jsdom, а окружение здесь `node`.
 *
 * Подмена ведёт себя как React ровно в том, что здесь важно: состояние
 * живёт между вызовами хука, а увидеть новое значение можно только
 * следующим вызовом — как компонент видит его следующим рендером.
 */
let state: string | null = null

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: () => [state, (next: string | null) => { state = next }],
  }
})

const { useCityNavigate, ALL_CITIES } = await import('@/components/geo/use-city-navigate')

// Вымышленные слаги, как в tests/geo.test.ts и tests/city-navigate.test.ts:
// они читаются нагляднее настоящих и не устареют, когда ученик
// переименует города. Хук берёт список параметром, от lib/content
// этот тест не зависит.
const CITY_SLUGS = ['almaty', 'astana']

describe('useCityNavigate', () => {
  beforeEach(() => {
    push.mockClear()
    currentPathname = '/almaty/uslugi/santehnik'
    state = null
  })

  describe('городская страница: меняется адрес, страница сохраняется', () => {
    it('со страницы услуги ведёт на ту же услугу в другом городе', () => {
      useCityNavigate(CITY_SLUGS).changeCity('astana')
      expect(push).toHaveBeenCalledWith('/astana/uslugi/santehnik')
    })

    it('«Весь Казахстан» уводит на общую версию той же страницы', () => {
      useCityNavigate(CITY_SLUGS).changeCity(ALL_CITIES)
      expect(push).toHaveBeenCalledWith('/uslugi/santehnik')
    })

    it('показывает город из адреса, а не выбранный ранее', () => {
      state = 'astana'
      expect(useCityNavigate(CITY_SLUGS).activeSlug).toBe('almaty')
    })

    it('общая версия городского раздела показывает «Весь Казахстан»', () => {
      currentPathname = '/uslugi'
      state = 'astana'
      expect(useCityNavigate(CITY_SLUGS).activeSlug).toBeNull()
    })
  })

  describe('обычная страница: адрес и содержимое не меняются', () => {
    beforeEach(() => {
      currentPathname = '/kontakty'
    })

    it('выбор города не уводит с обычной страницы', () => {
      useCityNavigate(CITY_SLUGS).changeCity('almaty')
      expect(push).not.toHaveBeenCalled()
    })

    // Менять на такой странице нечего, но нажатие обязано быть видно:
    // иначе список отпрыгивает обратно на «Весь Казахстан» под пальцем.
    it('нажатие видно: список остаётся на выбранном городе', () => {
      const first = useCityNavigate(CITY_SLUGS)
      expect(first.activeSlug).toBeNull()

      first.changeCity('astana')

      // Следующий вызов хука — это следующий рендер компонента.
      expect(useCityNavigate(CITY_SLUGS).activeSlug).toBe('astana')
    })

    it('«Весь Казахстан» снимает выбор', () => {
      useCityNavigate(CITY_SLUGS).changeCity('astana')
      useCityNavigate(CITY_SLUGS).changeCity(ALL_CITIES)
      expect(useCityNavigate(CITY_SLUGS).activeSlug).toBeNull()
    })

    // Ничего не сохраняется между визитами намеренно — см. комментарий
    // в use-city-navigate.ts. Свежий визит начинается с нейтрального
    // состояния, и оно верно с первого кадра, без мигания после гидратации.
    it('свежий визит начинается с «Весь Казахстан»', () => {
      expect(useCityNavigate(CITY_SLUGS).activeSlug).toBeNull()
    })
  })
})
