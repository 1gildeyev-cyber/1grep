import { SITE } from '@/lib/site'

/**
 * Ссылка на WhatsApp с преднаполненным сообщением.
 *
 * Текст — обязательный аргумент, а не значение по умолчанию из конфига:
 * это первая фраза, которую посетитель отправит бизнесу от своего имени,
 * и она обязана быть на его языке. Берётся из `contacts.whatsappText`
 * в `messages/<язык>.json`; значение по умолчанию здесь молча уводило бы
 * казахоязычного посетителя на русскую фразу.
 */
export function waLink(text: string): string {
  return `https://wa.me/${SITE.whatsapp.number}?text=${encodeURIComponent(text)}`
}
