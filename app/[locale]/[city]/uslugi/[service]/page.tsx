import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { cities, cityServiceText, findCity, findService, services } from '@/lib/content'
import { cityPath } from '@/lib/geo/city-path'
import { phoneRaw, phoneText } from '@/lib/phone'
import { localizedUrl, pageMeta } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { LeadButton } from '@/components/lead/lead-button'
import { LocalBusinessJsonLd } from '@/components/seo/local-business'

type Props = { params: Promise<{ locale: Locale; city: string; service: string }> }

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    cities.flatMap((city) =>
      services.map((service) => ({ locale, city: city.slug, service: service.slug })),
    ),
  )
}

/**
 * canonical — на СЕБЯ (эту городскую страницу), не на общую услугу:
 * pageMeta делает это сама, раз ей передан городской логический путь.
 * Страницы задуманы ранжироваться раздельно — канонизация на общую
 * убила бы весь смысл мультигео.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: citySlug, service: serviceSlug } = await params
  const city = findCity(citySlug)
  const service = findService(serviceSlug)
  if (!city || !service) notFound()

  const labels = service.labels[locale]
  const t = await getTranslations({ locale, namespace: 'meta' })
  // Уникальный текст пары, если он есть, — лучший источник описания:
  // он и заводился ради того, чтобы городские страницы не были дублями.
  const unique = cityServiceText(service.slug, city.slug, locale)
  const description =
    unique ||
    t('cityService', {
      title: labels.title,
      in: city.labels[locale].in,
      short: labels.short,
      name: SITE.name,
    })

  return {
    title: `${labels.title} ${city.labels[locale].in}`,
    ...pageMeta(cityPath(city.slug, `/uslugi/${service.slug}`), locale, description),
  }
}

/**
 * Заголовок — «{услуга} {город.in}»: «Сантехника в Алматы»,
 * не «Сантехника Алматы». Ради этого падежа city.in и заводился.
 * Валидация обеих частей слага обязательна: чужой город ИЛИ чужая
 * услуга — оба случая обязаны отдать 404, а не собранную страницу.
 */
export default async function Page({ params }: Props) {
  const { locale, city: citySlug, service: serviceSlug } = await params
  const city = findCity(citySlug)
  const service = findService(serviceSlug)
  if (!city || !service) notFound()

  setRequestLocale(locale)
  const t = await getTranslations()
  const labels = service.labels[locale]
  const contacts = city.contacts
  const uniqueText = cityServiceText(service.slug, city.slug, locale)
  const path = cityPath(city.slug, `/uslugi/${service.slug}`)

  const priceText = service.price
    ? t('service.priceFrom', { price: service.price.from.toLocaleString('ru-RU') })
    : t('service.priceOnRequest')

  return (
    <main>
      <Breadcrumbs path={path} locale={locale} segments={{ uslugi: t('nav.services') }} />
      <h1>
        {labels.title} {city.labels[locale].in}
      </h1>
      <p>{labels.body}</p>
      {/* Уникальный текст пары — сразу после общего текста услуги, если он есть.
          Страница обязана собираться и без него: cityServiceText возвращает undefined. */}
      {uniqueText && <p>{uniqueText}</p>}
      <p>{priceText}</p>

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
      </ul>

      <LeadButton source={`${city.slug}-uslugi-${service.slug}`}>{t('contacts.lead')}</LeadButton>

      <p>
        <Link href={`/uslugi/${service.slug}`}>{t('service.general')}</Link>
      </p>

      <LocalBusinessJsonLd city={city} locale={locale} pageUrl={localizedUrl(path, locale)} />
    </main>
  )
}
