import type { PhoneReason } from '@/lib/phone'

/**
 * Причина отказа `parsePhone` → ключ перевода в `messages/*.json` (`lead.errors.*`).
 * Держим сопоставление объектом, а не шаблонной строкой: собрать ключ
 * конкатенацией («phone» + причина) не выйдет — регистр первой буквы разный.
 */
const PHONE_ERROR_KEYS: Record<PhoneReason, string> = {
  empty: 'errors.phoneEmpty',
  short: 'errors.phoneShort',
  long: 'errors.phoneLong',
  format: 'errors.phoneFormat',
}

/**
 * Ключ перевода для ошибки телефона по issue схемы `leadSchema`. Причина
 * едет в `params.reason` и только у `issue.code === 'custom'` — так её
 * туда кладёт `lib/lead/schema.ts`. Неизвестная или отсутствующая причина
 * (например, issue от другого поля) даёт ключ ошибки формата.
 */
export function phoneErrorKey(issue: { code?: string; params?: Record<string, unknown> } | undefined): string {
  const reason = issue?.code === 'custom' ? issue.params?.reason : undefined
  return typeof reason === 'string' && reason in PHONE_ERROR_KEYS ? PHONE_ERROR_KEYS[reason as PhoneReason] : PHONE_ERROR_KEYS.format
}
