import { afterEach, describe, expect, it } from 'vitest'
import { readTicks, writeTick } from '@/lib/checklist-ticks'

/**
 * jsdom в шаблоне нет, и заводить его ради одного теста — лишняя
 * зависимость. Хранилище подменяется прямо в globalThis: readTicks
 * и writeTick обращаются к нему через globalThis.localStorage
 * и ничего больше из браузера не трогают, так что node-окружения хватает.
 * Что галочка держится после перезагрузки, проверено в браузере отдельно.
 */
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size
    },
  } satisfies Storage
}

function install(value: unknown) {
  Object.defineProperty(globalThis, 'localStorage', { value, configurable: true })
}

/** Приватное окно Safari и «блокировать данные сайтов»: бросает на самом доступе. */
function installThrowing() {
  Object.defineProperty(globalThis, 'localStorage', {
    get() {
      throw new DOMException('storage is disabled')
    },
    configurable: true,
  })
}

afterEach(() => install(undefined))

describe('галочки чек-листа в localStorage', () => {
  it('записанное читается обратно', () => {
    install(fakeStorage())
    writeTick('Контакты::Телефон', true)
    expect(readTicks()).toEqual({ 'Контакты::Телефон': true })
  })

  it('снятая галочка не считается поставленной', () => {
    install(fakeStorage())
    writeTick('Контакты::Телефон', false)
    expect(readTicks()['Контакты::Телефон']).toBe(false)
  })

  it('пустое хранилище — пустой набор, а не падение', () => {
    install(fakeStorage())
    expect(readTicks()).toEqual({})
  })

  it('испорченное значение не роняет страницу', () => {
    install(fakeStorage({ 'site:checklist': 'не json' }))
    expect(readTicks()).toEqual({})
  })

  it('чужой тип значения не роняет страницу', () => {
    install(fakeStorage({ 'site:checklist': '["массив"]' }))
    expect(readTicks()).toEqual({})
  })

  it('хранилища нет вовсе — читается пустой набор, запись молчит', () => {
    install(undefined)
    expect(readTicks()).toEqual({})
    expect(() => writeTick('a', true)).not.toThrow()
  })

  it('хранилище запрещено браузером — тоже без падения', () => {
    installThrowing()
    expect(readTicks()).toEqual({})
    expect(() => writeTick('a', true)).not.toThrow()
  })
})

/**
 * Списков на экране два, и у каждого своя копия состояния (почему это
 * стирало галочки и почему лечится слиянием — докблок `writeTick`).
 * Каждый экземпляр отдаёт хранилищу только свой тронутый пункт — другого
 * `writeTick` не принимает, — и чужая запись обязана уцелеть.
 */
describe('галочки чек-листа: две половины списка не мешают друг другу', () => {
  it('галочка второго списка не стирает галочку первого', () => {
    install(fakeStorage())

    writeTick('SEO::Ключевые запросы (5–10)', true)
    writeTick('О бизнесе::Название компании / бренда', true)

    expect(readTicks()).toEqual({
      'SEO::Ключевые запросы (5–10)': true,
      'О бизнесе::Название компании / бренда': true,
    })
  })

  it('порядок обратный — результат тот же', () => {
    install(fakeStorage())

    writeTick('О бизнесе::Название компании / бренда', true)
    writeTick('SEO::Ключевые запросы (5–10)', true)

    expect(readTicks()).toEqual({
      'О бизнесе::Название компании / бренда': true,
      'SEO::Ключевые запросы (5–10)': true,
    })
  })

  it('снял → поставил заново → галочка в другом списке: обе на месте', () => {
    install(fakeStorage())
    writeTick('О бизнесе::Название компании / бренда', true)
    writeTick('О бизнесе::Название компании / бренда', false)
    writeTick('О бизнесе::Название компании / бренда', true)
    writeTick('SEO::Ключевые запросы (5–10)', true)

    expect(readTicks()).toEqual({
      'О бизнесе::Название компании / бренда': true,
      'SEO::Ключевые запросы (5–10)': true,
    })
  })

  it('снятие галочки переживает слияние: false остаётся false', () => {
    install(fakeStorage())
    writeTick('SEO::Ключевые запросы (5–10)', true)
    writeTick('SEO::Ключевые запросы (5–10)', false)
    expect(readTicks()['SEO::Ключевые запросы (5–10)']).toBe(false)
  })

  it('снятие в одной половине не гасит галочку в другой', () => {
    install(fakeStorage())
    writeTick('SEO::Ключевые запросы (5–10)', true)
    writeTick('О бизнесе::Название компании / бренда', true)
    writeTick('SEO::Ключевые запросы (5–10)', false)
    expect(readTicks()['О бизнесе::Название компании / бренда']).toBe(true)
  })

  // Ключ один на весь сайт, языка страницы в нём нет: открыв `/kk` после
  // `/`, автор сайта обязан увидеть тот же чек-лист в том же состоянии.
  it('ключ один на весь сайт — язык страницы в него не входит', () => {
    const storage = fakeStorage()
    install(storage)
    writeTick('Контакты::Телефон', true)
    expect(storage.key(0)).toBe('site:checklist')
    expect(storage.length).toBe(1)
  })
})
