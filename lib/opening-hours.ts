/**
 * Часы работы для schema.org.
 *
 * В `lib/site.ts` и у города (`City.contacts.hours`) часы лежат в том виде,
 * в каком их пишет человек и в каком они показываются на странице:
 * «Пн–Пт 9:00–18:00». В разметке `openingHours` этот вид невалиден —
 * schema.org ждёт `Mo-Fr 09:00-18:00`, а невалидное значение парсер молча
 * выбрасывает. Ученик при этом уверен, что разметка есть.
 *
 * Поэтому одно поле обслуживает обе задачи: на странице печатается как
 * написано, в JSON-LD уезжает через эту функцию. Не разобрали — возвращаем
 * undefined, и `openingHours` не выводится вовсе: отсутствующее поле честнее
 * невалидного (тот же принцип, что у пустого `sameAs` в json-ld.tsx).
 */

/** Русские и казахские сокращения дней. Ср и Сб в обоих языках — один день. */
const DAYS: Record<string, string> = {
  пн: 'Mo', вт: 'Tu', ср: 'We', чт: 'Th', пт: 'Fr', сб: 'Sa', вс: 'Su',
  дс: 'Mo', сс: 'Tu', бс: 'Th', жм: 'Fr', жс: 'Su',
  mo: 'Mo', tu: 'Tu', we: 'We', th: 'Th', fr: 'Fr', sa: 'Sa', su: 'Su',
}

const DAY = '(?:Mo|Tu|We|Th|Fr|Sa|Su|PH)'
/** Готовая запись schema.org: `Mo-Fr 09:00-18:00`, `Sa,Su 10:00-16:00`. */
const SCHEMA_FORM = new RegExp(`^${DAY}(?:[-,]${DAY})*\\s\\d{2}:\\d{2}-\\d{2}:\\d{2}$`)

/** `Пн–Пт 9:00–18:00`, `пн-пт 09:00-18:00`, `Сб 10:00–16:00`. */
const HUMAN_FORM = /^([\p{L}]{2})\s*(?:[-–—]\s*([\p{L}]{2}))?\s+(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})$/u

function pad(hour: string): string {
  return hour.padStart(2, '0')
}

export function schemaOpeningHours(value?: string): string | undefined {
  const text = value?.trim()
  if (!text) return undefined

  // Уже по форме schema.org — отдаём как есть, ничего не угадывая.
  if (SCHEMA_FORM.test(text)) return text

  const parsed = text.match(HUMAN_FORM)
  if (!parsed) return undefined

  const [, fromRaw, toRaw, openHour, openMinute, closeHour, closeMinute] = parsed
  const from = DAYS[fromRaw.toLowerCase()]
  const to = toRaw ? DAYS[toRaw.toLowerCase()] : undefined
  if (!from || (toRaw && !to)) return undefined

  const days = to ? `${from}-${to}` : from
  return `${days} ${pad(openHour)}:${openMinute}-${pad(closeHour)}:${closeMinute}`
}
