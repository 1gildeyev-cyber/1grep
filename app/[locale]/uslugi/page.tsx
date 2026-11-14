import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { services } from '@/lib/content'
import { pageMeta } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'

type Props = { params: Promise<{ locale: Locale }> }

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return {
    title: t('nav.services'),
    ...pageMeta('/uslugi', locale, t('meta.services', { name: SITE.name })),
  }
}

/**
 * Список всех услуг сайта. Каждая карточка ведёт на свою страницу
 * (`/uslugi/<slug>`) — оттуда уже идёт перелинковка с городами.
 * Дизайна нет: заголовок, список, короткое описание под каждой ссылкой.
 */
export default async function Page({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <main>
      <Breadcrumbs path="/uslugi" locale={locale} segments={{ uslugi: t('nav.services') }} />
      <h1>{t('nav.services')}</h1>
      <ul>
        {services.map((service) => (
          <li key={service.slug}>
            <Link href={`/uslugi/${service.slug}`}>{service.labels[locale].title}</Link>
            <p>{service.labels[locale].short}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
