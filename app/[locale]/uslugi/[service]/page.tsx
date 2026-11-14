import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { cities, findService, services } from '@/lib/content'
import { cityPath } from '@/lib/geo/city-path'
import { pageMeta } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { LeadButton } from '@/components/lead/lead-button'

type Props = { params: Promise<{ locale: Locale; service: string }> }

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    services.map((service) => ({ locale, service: service.slug })),
  )
}

/**
 * `notFound()` уже здесь, а не только в самой странице: рекомендованный
 * Next-паттерн — так 404 отдаётся и на стадии метадаты, а не только рендера,
 * и canonical/hreflang несуществующей услуги не попадают в HTML вовсе.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, service: slug } = await params
  const service = findService(slug)
  if (!service) notFound()

  const labels = service.labels[locale]
  const t = await getTranslations({ locale, namespace: 'meta' })
  const description = t('service', {
    title: labels.title,
    short: labels.short,
    name: SITE.name,
  })

  return { title: labels.title, ...pageMeta(`/uslugi/${slug}`, locale, description) }
}

export default async function Page({ params }: Props) {
  const { locale, service: slug } = await params
  const service = findService(slug)
  if (!service) notFound()

  setRequestLocale(locale)
  const t = await getTranslations()
  const labels = service.labels[locale]

  // Цена необязательна: у второй услуги-заглушки её нет намеренно,
  // чтобы на странице была видна ветка «по запросу».
  const priceText = service.price
    ? t('service.priceFrom', { price: service.price.from.toLocaleString('ru-RU') })
    : t('service.priceOnRequest')

  return (
    <main>
      <Breadcrumbs
        path={`/uslugi/${slug}`}
        locale={locale}
        segments={{ uslugi: t('nav.services') }}
      />
      <h1>{labels.title}</h1>
      <p>{labels.body}</p>
      <p>{priceText}</p>
      <LeadButton source={`uslugi-${slug}`}>{t('contacts.lead')}</LeadButton>

      {/* Перелинковка с городами: без неё городские страницы задачи 7
          останутся сиротами — на них не поведёт ни одна ссылка с сайта. */}
      <section>
        <h2>{t('service.cities')}</h2>
        <ul>
          {cities.map((city) => (
            <li key={city.slug}>
              <Link href={cityPath(city.slug, `/uslugi/${slug}`)}>{city.labels[locale].name}</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
