import { describe, expect, it } from 'vitest'
import { schemaOpeningHours } from '@/lib/opening-hours'

/**
 * Часы работы пишет человек и видит человек, а schema.org ждёт `Mo-Fr 09:00-18:00`.
 * Не разобрали — поля в разметке не будет вовсе: невалидное значение парсер
 * молча выбрасывает, и ученик остаётся уверен, что разметка есть.
 */
describe('schemaOpeningHours', () => {
  it('переводит русскую запись из брифа', () => {
    expect(schemaOpeningHours('Пн–Пт 9:00–18:00')).toBe('Mo-Fr 09:00-18:00')
    expect(schemaOpeningHours('пн-пт 09:00-18:00')).toBe('Mo-Fr 09:00-18:00')
    expect(schemaOpeningHours('Сб 10:00—16:00')).toBe('Sa 10:00-16:00')
  })

  it('понимает казахские сокращения дней', () => {
    expect(schemaOpeningHours('Дс–Жм 9:00–18:00')).toBe('Mo-Fr 09:00-18:00')
    expect(schemaOpeningHours('Сб–Жс 10:00–16:00')).toBe('Sa-Su 10:00-16:00')
  })

  it('готовую запись schema.org отдаёт как есть', () => {
    expect(schemaOpeningHours('Mo-Fr 09:00-18:00')).toBe('Mo-Fr 09:00-18:00')
    expect(schemaOpeningHours('Sa,Su 10:00-16:00')).toBe('Sa,Su 10:00-16:00')
  })

  it('на непонятой строке молчит, а не выдумывает', () => {
    expect(schemaOpeningHours('круглосуточно')).toBeUndefined()
    expect(schemaOpeningHours('ежедневно с 9 до 18')).toBeUndefined()
    expect(schemaOpeningHours('Пн–Хз 9:00–18:00')).toBeUndefined()
    expect(schemaOpeningHours('')).toBeUndefined()
    expect(schemaOpeningHours(undefined)).toBeUndefined()
  })
})
