import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { routing } from '@/i18n/routing'
import { SITE } from '@/lib/site'
import ru from '@/messages/ru.json'
import kk from '@/messages/kk.json'

describe('языковая маршрутизация', () => {
  it('берёт языки из SITE, а не из своего списка', () => {
    expect(routing.locales).toEqual(SITE.locales)
    expect(routing.defaultLocale).toBe(SITE.defaultLocale)
  })

  it('основной язык — первый в списке', () => {
    expect(SITE.locales[0]).toBe(SITE.defaultLocale)
  })

  it('держит префикс as-needed: основной язык без префикса', () => {
    expect(routing.localePrefix).toBe('as-needed')
  })
})

/** Плоский список ключей: 'lead.errors.phoneFormat' вместо вложенных объектов. */
function flatKeys(messages: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? flatKeys(value as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )
}

describe('словари', () => {
  it('у каждого языка есть свой файл', () => {
    for (const locale of SITE.locales) {
      expect(existsSync(join(process.cwd(), 'messages', `${locale}.json`)), `нет messages/${locale}.json`).toBe(true)
    }
  })

  // Расхождение наборов — это не «где-то не хватает перевода», а падение
  // страницы: next-intl на отсутствующий ключ бросает ошибку.
  it('наборы ключей совпадают', () => {
    expect(flatKeys(kk).sort()).toEqual(flatKeys(ru).sort())
  })

  // Единственный тест вне guard-а, который смотрит в содержимое файлов
  // шаблона (messages/*.json), и это намеренное исключение из правила
  // «содержимое шаблона утверждает только guard»: он проверяет не начальное
  // состояние репозитория, а инвариант качества — что перевод не скопирован
  // без перевода. У исключения есть люк — SAME_IN_BOTH ниже.
  //
  // Слова, которые в двух языках пишутся одинаково. Список явный,
  // чтобы «пока сойдёт, переведу потом» не проходило молча.
  const SAME_IN_BOTH = ['offer.phone'] // «Телефон:» — то же слово и по-казахски

  it('казахский не скопирован с русского', () => {
    const copied = flatKeys(ru).filter((key) => {
      if (SAME_IN_BOTH.includes(key)) return false
      const read = (messages: Record<string, unknown>) =>
        key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], messages)
      const russian = read(ru)
      // Латиница и знаки препинания совпадать имеют право — кириллица нет.
      return typeof russian === 'string' && /[а-яё]/i.test(russian) && read(kk) === russian
    })

    expect(copied, `не переведено: ${copied.join(', ')}`).toEqual([])
  })
})
