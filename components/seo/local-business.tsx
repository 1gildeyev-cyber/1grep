import type { Locale } from '@/i18n/routing'
import type { City } from '@/lib/content'
import { schemaOpeningHours } from '@/lib/opening-hours'
import { phoneRaw } from '@/lib/phone'
import { SITE } from '@/lib/site'

/**
 * LocalBusiness одного города — узел городской страницы.
 * Отдельным файлом, а не рядом с buildGraph в json-ld.tsx: тот описывает
 * компанию целиком и один на весь сайт, а этот собирается на каждой
 * городской странице из своего города. Плюс json-ld.tsx с ним перевалил
 * за 150 строк — предел, после которого правка становится дорогой.
 *
 * Идентификатор привязан к адресу страницы: у каждого города свой узел,
 * и все они подчинены общей Organization из json-ld.tsx.
 *
 * Пустые поля не выводить вовсе: пустое значение хуже отсутствующего —
 * на этом сайт уже спотыкался с `sameAs: []`. Поэтому адрес, часы и карта
 * подставляются, только если заполнены у города; телефон при пустых
 * контактах филиала берётся общий из SITE.
 *
 * Везде `||`, а не `??`: пустая строка — это «не заполнено», а не значение.
 * `??` пропустил бы `phone: ''` в разметку пустым полем, и ученик,
 * скопировавший город и не стёрший пустой ключ, узнал бы об этом
 * от Search Console.
 */
export function localBusinessGraph(
  city: City,
  locale: Locale,
  pageUrl: string,
): Record<string, unknown> {
  const labels = city.labels[locale]
  const contacts = city.contacts ?? {}

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${pageUrl}#business`,
    name: `${SITE.name} — ${labels.name}`,
    url: pageUrl,
    parentOrganization: { '@id': `${SITE.url}#organization` },
    telephone: phoneRaw(contacts.phone || SITE.primaryPhone.raw),
    geo: { '@type': 'GeoCoordinates', latitude: city.geo.lat, longitude: city.geo.lng },
    address: {
      '@type': 'PostalAddress',
      addressLocality: labels.name,
      addressCountry: 'KZ',
      ...(contacts.address ? { streetAddress: contacts.address } : {}),
    },
    // Часы уезжают в разметку только в форме schema.org: «Пн–Пт 9:00–18:00»
    // парсер молча выбросил бы, а ученик считал бы, что разметка есть.
    ...(schemaOpeningHours(contacts.hours)
      ? { openingHours: schemaOpeningHours(contacts.hours) }
      : {}),
    ...(contacts.mapUrl ? { hasMap: contacts.mapUrl } : {}),
  }
}

/** Рендерится на городской странице, рядом с её содержимым. */
export function LocalBusinessJsonLd({
  city,
  locale,
  pageUrl,
}: {
  city: City
  locale: Locale
  pageUrl: string
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessGraph(city, locale, pageUrl)) }}
    />
  )
}
