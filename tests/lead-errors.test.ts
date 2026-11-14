import { describe, expect, it } from 'vitest'
import { phoneErrorKey } from '@/components/lead/lead-errors'
import ru from '@/messages/ru.json'
import kk from '@/messages/kk.json'

const REASONS = ['empty', 'short', 'long', 'format'] as const

/** Разрешает путь по точкам: 'lead.errors.phoneShort' вместо вложенных объектов. */
function resolve(messages: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages)
}

describe('phoneErrorKey', () => {
  it.each(REASONS)('причина «%s» даёт ключ, существующий в обоих словарях', (reason) => {
    const key = phoneErrorKey({ code: 'custom', params: { reason } })
    // Путь `lead.<ключ>` — так его же читает `t()` из useTranslations('lead')
    // в components/lead/lead-form.tsx. Опечатка вроде `phoneShortt` даст
    // здесь `undefined` вместо строки, а не покажется посетителю в форме.
    expect(resolve(ru, `lead.${key}`), `нет в ru.json: lead.${key}`).toBeTypeOf('string')
    expect(resolve(kk, `lead.${key}`), `нет в kk.json: lead.${key}`).toBeTypeOf('string')
  })

  it('четыре причины дают четыре разных ключа', () => {
    const keys = REASONS.map((reason) => phoneErrorKey({ code: 'custom', params: { reason } }))
    expect(new Set(keys).size).toBe(REASONS.length)
  })

  it.each([
    ['issue не задан', undefined],
    ['issue от другого поля', { code: 'too_small' }],
    ['причина не входит в PhoneReason', { code: 'custom', params: { reason: 'nope' } }],
  ] as const)('%s → та же причина, что у формата', (_label, issue) => {
    expect(phoneErrorKey(issue)).toBe(phoneErrorKey({ code: 'custom', params: { reason: 'format' } }))
  })

  // Буквальный якорь: сопоставление могут выпотрошить так, что все причины
  // дадут один и тот же (валидный) ключ формата — тесты выше это не поймают,
  // если сравнивать только со значением format. Этот тест сравнивает с
  // конкретной строкой и падает при любой такой порче причины `short`.
  it('причина short даёт ровно errors.phoneShort', () => {
    expect(phoneErrorKey({ code: 'custom', params: { reason: 'short' } })).toBe('errors.phoneShort')
  })
})
