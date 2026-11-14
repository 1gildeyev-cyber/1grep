import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { cities, findCity, services } from '@/lib/content'
import { cityPath } from '@/lib/geo/city-path'
import { pageMeta } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'

type Props = { params: Promise<{ locale: Locale; city: string }> }

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => cities.map((city) => ({ locale, city: city.slug })))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: citySlug } = await params
  const city = findCity(citySlug)
  if (!city) notFound()

  const t = await getTranslations({ locale })
  const description = t('meta.cityServices', {
    in: city.labels[locale].in,
    name: SITE.name,
  })

  return {
    title: `${t('nav.services')} ${city.labels[locale].in}`,
    ...pageMeta(cityPath(city.slug, '/uslugi'), locale, description),
  }
}

/**
 * Список услуг в городе — городской аналог /uslugi (см. app/[locale]/uslugi/page.tsx).
 * Заголовок собирается через падеж `labels[locale].in`, а не именительный —
 * тот же принцип, что и у заголовка страницы услуги в городе.
 */
export default async function Page({ params }: Props) {
  const { locale, city: citySlug } = await params
  const city = findCity(citySlug)
  if (!city) notFound()

  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <main>
      <Breadcrumbs
        path={cityPath(city.slug, '/uslugi')}
        locale={locale}
        segments={{ uslugi: t('nav.services') }}
      />
      <h1>
        {t('nav.services')} {city.labels[locale].in}
      </h1>
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
    </main>
  )
}
