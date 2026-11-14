import { describe, expect, it } from 'vitest'
import { parsePath } from '@/lib/geo/parse-path'
import { cityPath } from '@/lib/geo/city-path'

const CITIES = ['almaty', 'astana']

/**
 * Куда уведёт переключатель — та же логика, что в useCityNavigate
 * (components/geo/use-city-navigate.ts), но без рендера и без роутера:
 * важно доказать, куда ведёт функция, а не то, что компонент отрисовался.
 */
function targetFor(pathname: string, city: string) {
  const { logical, cityAware } = parsePath(pathname, CITIES)
  return cityAware ? cityPath(city, logical) : null
}

describe('переключение города', () => {
  it('со страницы услуги ведёт на ту же услугу в другом городе', () => {
    expect(targetFor('/almaty/uslugi/santehnik', 'astana')).toBe('/astana/uslugi/santehnik')
  })

  // Этот тест формально избыточен рядом с предыдущим — оба проверяют один
  // и тот же вызов. Он держит буквальную формулировку требования заказчика
  // («не должен перекидывать на главную города») и не удаляется как
  // избыточный: положительный тест доказывает, куда ведёт переключатель,
  // этот — куда он точно НЕ должен вести.
  it('НЕ уводит на главную города', () => {
    expect(targetFor('/almaty/uslugi/santehnik', 'astana')).not.toBe('/astana')
  })

  it('с общей услуги ведёт на городскую версию', () => {
    expect(targetFor('/uslugi/santehnik', 'almaty')).toBe('/almaty/uslugi/santehnik')
  })

  it('с языкового адреса сохраняет страницу', () => {
    expect(targetFor('/kk/almaty/uslugi/santehnik', 'astana')).toBe('/astana/uslugi/santehnik')
  })

  // Обычная страница (например, /kontakty) городской версии не имеет:
  // адрес переключателю менять некуда, обновляется только шапка.
  it('на обычной странице адрес не меняется', () => {
    expect(targetFor('/kontakty', 'almaty')).toBeNull()
  })
})
