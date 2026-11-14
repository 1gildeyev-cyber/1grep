import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildChecklist } from '@/lib/checklist'

/**
 * Чек-лист целиком: деление брифа на «собрать сейчас» и «перед запуском»
 * и подписи, которые увидит человек. Арифметика свёртки — в соседнем
 * `checklist-fold.test.ts`, хранение галочек — в `checklist-ticks.test.ts`.
 */
const brief = readFileSync(join(process.cwd(), 'brief.md'), 'utf8')

/** Все пункты обеих половин чек-листа одним списком. */
const allItems = (text: string) => {
  const { now, later } = buildChecklist(text)
  return [...now, ...later].flatMap((group) => group.items)
}

describe('buildChecklist: Блок Б показывается отдельно', () => {
  it('разделы после заголовка «БЛОК Б» уходят в later', () => {
    const text =
      '# БЛОК А\n## 1. О бизнесе\n- **Название:**\n' +
      '# БЛОК Б — перед запуском\n## 9. Заявки\n- **Куда слать:**\n'
    const { now, later } = buildChecklist(text)
    expect(now.map((group) => group.name)).toEqual(['О бизнесе'])
    expect(later.map((group) => group.name)).toEqual(['Заявки'])
  })

  it('домен — исключение: он из Блока Б, но нужен рано', () => {
    const text = '# БЛОК Б\n## 8. Домен\n- **Домен:**\n## 9. Заявки\n- **Куда слать:**\n'
    const { now, later } = buildChecklist(text)
    expect(now.map((group) => group.name)).toEqual(['Домен'])
    expect(later.map((group) => group.name)).toEqual(['Заявки'])
  })

  it('на настоящем brief.md домен стоит в раннем списке, а не в позднем', () => {
    const { now, later } = buildChecklist(brief)
    expect(now.map((group) => group.name)).toEqual([
      'О бизнесе',
      'Языки и география',
      'Структура сайта',
      'Контент',
      'Визуал и референсы',
      'Контакты',
      'Реквизиты',
      'Домен',
    ])
    expect(later.map((group) => group.name)).toEqual(['Заявки', 'Аналитика', 'SEO'])
  })

  it('пустых групп в чек-листе нет', () => {
    const { now, later } = buildChecklist(brief)
    expect([...now, ...later].filter((group) => group.items.length === 0)).toEqual([])
  })
})

describe('buildChecklist: на настоящем brief.md', () => {
  it('в подписях пунктов не остаётся номеров вида «№1»', () => {
    const stray = allItems(brief).filter((item) => item.label.includes('№'))
    expect(stray.map((item) => item.label)).toEqual([])
  })

  it('идентификаторы пунктов уникальны — это ключи галочек в браузере', () => {
    const ids = allItems(brief).map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('на пустом шаблоне отмеченных пунктов нет', () => {
    expect(allItems(brief).filter((item) => item.done)).toEqual([])
    expect(allItems(brief).filter((item) => item.inBrief > 0)).toEqual([])
  })

  /**
   * Три таблицы городов и три таблицы услуг — шесть отдельных пунктов,
   * а не два. Это главное отличие от лендинга: там ни одной многоязычной
   * таблицы нет, и такой пункт сломать нечем.
   */
  it('города и услуги разложены по таблицам брифа', () => {
    const { now } = buildChecklist(brief)
    const labelsOf = (name: string) => now.find((group) => group.name === name)!.items.map((item) => item.label)
    expect(labelsOf('Языки и география')).toEqual(
      expect.arrayContaining([
        'Города — общие данные',
        'Города — падежи, русский',
        'Города — падежи, қазақша',
      ]),
    )
    expect(labelsOf('Контент')).toEqual(
      expect.arrayContaining([
        'Услуги — общие данные',
        'Услуги — русский',
        'Услуги — қазақша',
        'Тексты страниц услуг',
      ]),
    )
  })

  /**
   * Фотографии, соцсети и страницы кроме главной были оформлены дефисными
   * подпунктами без звёздочек — парсер такие строки не видит, и в чек-листе
   * их не было. Приведены к форме поля; если кто-то вернёт старый вид,
   * этот тест покраснеет раньше, чем пропажу заметят на сайте.
   */
  it('фотографии, соцсети и лишние страницы — видимые пункты', () => {
    const labels = allItems(brief).map((item) => item.label)
    expect(labels).toEqual(
      expect.arrayContaining([
        'Фото команды и офиса',
        'Фото товаров или процесса работы',
        'Instagram',
        'YouTube',
        'TikTok',
      ]),
    )
    expect(labels.some((label) => label.startsWith('Страницы кроме главной'))).toBe(true)
  })
})

describe('buildChecklist: заполненный бриф гасит пункты', () => {
  const filled = brief
    .replace('- **Название компании / бренда:**', '- **Название компании / бренда:** Ромашка')
    .replace('- **Instagram:**', '- **Instagram:** @romashka')
    .replace(
      '**Города — падежи, русский** (тот же слаг, что и в таблице выше):\n\n| Слаг | Название | «в ком/чём» (Алматы → в Алматы) | «по кому/чему» (Алматы → по Алматы) |\n| --- | --- | --- | --- |\n|  |  |  |  |',
      '**Города — падежи, русский** (тот же слаг, что и в таблице выше):\n\n| Слаг | Название | «в ком/чём» (Алматы → в Алматы) | «по кому/чему» (Алматы → по Алматы) |\n| --- | --- | --- | --- |\n| almaty | Алматы | в Алматы | по Алматы |',
    )

  const find = (label: string) => allItems(filled).find((item) => item.label === label)!

  it('одиночное поле с ответом отмечено и заблокировано', () => {
    expect(find('Название компании / бренда')).toMatchObject({ done: true, inBrief: 0 })
    expect(find('Instagram')).toMatchObject({ done: true, inBrief: 0 })
  })

  it('заполненная строка таблицы даёт «в брифе», но галочку не ставит', () => {
    expect(find('Города — падежи, русский')).toMatchObject({ done: false, inBrief: 1 })
  })

  it('соседняя таблица падежей остаётся пустой', () => {
    expect(find('Города — падежи, қазақша')).toMatchObject({ done: false, inBrief: 0 })
  })
})
