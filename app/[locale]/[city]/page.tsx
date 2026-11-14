import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { cities, findCity, services } from '@/lib/content'
import { cityPath } from '@/lib/geo/city-path'
import { phoneRaw, phoneText } from '@/lib/phone'
import { localizedUrl, pageMeta } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { LeadButton } from '@/components/lead/lead-button'
import { LocalBusinessJsonLd } from '@/components/seo/local-business'

type Props = { params: Promise<{ locale: Locale; city: string }> }

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => cities.map((city) => ({ locale, city: city.slug })))
}

/**
 * Заголовок — «{SITE.name} {city.in}», падеж, а не именительный:
 * «Сантехлюкс Алматы» читался бы как две несвязанные строки, а не
 * «Сантехлюкс в Алматы» — вот падеж и нужен.
 * Валидация обязательна и здесь: без неё [city] отдаёт метадату
 * (а значит, и 200) на любой мусорный слаг.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: citySlug } = await params
  const city = findCity(citySlug)
  if (!city) notFound()

  const labels = city.labels[locale]
  const t = await getTranslations({ locale, namespace: 'meta' })
  const description = t('city', { name: SITE.name, in: labels.in, by: labels.by })

  return {
    // absolute, а не обычный title: шаблон корневого layout — `%s — ${SITE.name}`,
    // а этот заголовок уже начинается с названия. Без absolute вышло бы
    // «Сантехлюкс в Алматы — Сантехлюкс».
    // Пример намеренно вымышленный, а не заглушка шаблона: строки
    // из PLACEHOLDER_LIST guard-тест ищет и в комментариях тоже
    // (tests/placeholders.test.ts сканирует app/), и такая строка
    // держала бы `pnpm test` красным после любого /brand-init —
    // её не заменяет и он.
    title: { absolute: `${SITE.name} ${labels.in}` },
    ...pageMeta(cityPath(city.slug, '/'), locale, description),
  }
}

/**
 * Городской хаб: содержательный аналог главной, привязанный к городу.
 * canonical — на себя (см. pageMeta выше), не на общую главную.
 */
export default async function Page({ params }: Props) {
  const { locale, city: citySlug } = await params
  const city = findCity(citySlug)
  if (!city) notFound()

  setRequestLocale(locale)
  const t = await getTranslations()
  const labels = city.labels[locale]
  const contacts = city.contacts
  const path = cityPath(city.slug, '/')

  return (
    <main>
      <Breadcrumbs path={path} locale={locale} />
      <h1>
        {SITE.name} {labels.in}
      </h1>

      <section>
        <h2>{t('nav.services')}</h2>
        <ul>
          {services.map((service) => (
            <li key={service.slug}>
              <Link href={cityPath(city.slug, `/uslugi/${service.slug}`)}>
                {service.labels[locale].title}
              </Link>
              <p>{service.labels[locale].short}</p>
            </li>
          ))}
        </ul>
        <Link href={cityPath(city.slug, '/uslugi')}>{t('nav.allServices')}</Link>
      </section>

      <section>
        <h2>{t('nav.contacts')}</h2>
        <ul>
          <li>
            {t('contacts.phone')}{' '}
            <a href={`tel:${phoneRaw(contacts?.phone || SITE.primaryPhone.raw)}`}>
              {contacts?.phone ? phoneText(contacts.phone) : SITE.primaryPhone.display}
            </a>
          </li>
          {(contacts?.address || SITE.address.full) && (
            <li>
              {t('contacts.address')} {contacts?.address || SITE.address.full}
            </li>
          )}
          {(contacts?.hours || SITE.hours) && (
            <li>
              {t('contacts.hours')} {contacts?.hours || SITE.hours}
            </li>
          )}
          {(contacts?.mapUrl || SITE.mapUrl) && (
            <li>
              <a href={contacts?.mapUrl || SITE.mapUrl} target="_blank" rel="noopener noreferrer">
                {t('contacts.map')}
              </a>
            </li>
          )}
        </ul>
        <LeadButton source={`city-${city.slug}`}>{t('contacts.lead')}</LeadButton>
      </section>

      <LocalBusinessJsonLd city={city} locale={locale} pageUrl={localizedUrl(path, locale)} />
    </main>
  )
}
