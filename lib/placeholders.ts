/**
 * Единственное место, где объявлены заглушки шаблона. Кто угодно, кому
 * нужно то же значение — guard-тест (tests/placeholders.test.ts) или
 * чек-лист первого экрана (components/dashboard/onboarding-panel.tsx) —
 * берёт его отсюда, а не набирает строку заново.
 * Одно место правки вместо нескольких синхронных копий.
 *
 * Сам этот файл заглушки не «забывает заменить» — он их определяет,
 * поэтому guard-тест сканирует lib/, но явно пропускает именно его
 * (см. EXCLUDE_FILES в tests/placeholders.test.ts).
 */
export const PLACEHOLDER = {
  domain: 'example.kz',
  phoneDisplay: '+7 700 000 00 00',
  whatsapp: '77000000000',
  bin: '000000000000',
  name: 'Пример Сервис',
  legalName: 'ТОО «Пример»',

  cityOne: 'gorod-odin',
  cityTwo: 'gorod-dva',
  cityOneName: 'Город Один',
  cityTwoName: 'Город Два',
  cityOneNameKk: 'Бірінші Қала',
  cityTwoNameKk: 'Екінші Қала',
  serviceOne: 'usluga-odna',
  serviceTwo: 'usluga-dva',
  serviceOneName: 'Услуга Одна',
  serviceTwoName: 'Услуга Две',
  serviceOneNameKk: 'Бірінші Қызмет',
  serviceTwoNameKk: 'Екінші Қызмет',
} as const

/** Тот же набор — списком для guard-теста: значение и подсказка по-русски. */
export const PLACEHOLDER_LIST: Array<{ value: string; hint: string }> = [
  { value: PLACEHOLDER.domain, hint: 'домен' },
  { value: PLACEHOLDER.phoneDisplay, hint: 'телефон' },
  { value: PLACEHOLDER.whatsapp, hint: 'телефон для WhatsApp/tel:' },
  { value: PLACEHOLDER.bin, hint: 'БИН' },
  { value: PLACEHOLDER.name, hint: 'название компании' },
  { value: PLACEHOLDER.legalName, hint: 'юридическое лицо' },

  { value: PLACEHOLDER.cityOne, hint: 'первый город (слаг)' },
  { value: PLACEHOLDER.cityTwo, hint: 'второй город (слаг)' },
  { value: PLACEHOLDER.cityOneName, hint: 'название первого города' },
  { value: PLACEHOLDER.cityTwoName, hint: 'название второго города' },
  { value: PLACEHOLDER.cityOneNameKk, hint: 'название первого города на казахском' },
  { value: PLACEHOLDER.cityTwoNameKk, hint: 'название второго города на казахском' },
  { value: PLACEHOLDER.serviceOne, hint: 'первая услуга (слаг)' },
  { value: PLACEHOLDER.serviceTwo, hint: 'вторая услуга (слаг)' },
  { value: PLACEHOLDER.serviceOneName, hint: 'название первой услуги' },
  { value: PLACEHOLDER.serviceTwoName, hint: 'название второй услуги' },
  { value: PLACEHOLDER.serviceOneNameKk, hint: 'название первой услуги на казахском' },
  { value: PLACEHOLDER.serviceTwoNameKk, hint: 'название второй услуги на казахском' },
]
