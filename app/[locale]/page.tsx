import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { services } from '@/lib/content'
import { pageMeta } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { LeadButton } from '@/components/lead/lead-button'
import { OnboardingPanel } from '@/components/dashboard/onboarding-panel'

// canonical, og:url и hreflang этой страницы. См. pageMeta в lib/seo.ts —
// в корневом layout адреса нет намеренно. Константой метадату не объявить:
// адрес зависит от языка, а язык приходит параметром маршрута.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return pageMeta('/', locale, t('site'))
}

/**
 * Главная страница сайта. Заголовок и описание — из SITE (заполняются
 * из brief.md), список услуг и ссылки на разделы — из lib/content. Крошек
 * на главной нет: цепочка из одного звена «Главная» — не навигация,
 * Breadcrumbs сама вернёт null. Дизайна и вёрстки здесь нет — макет
 * добавляет автор сайта.
 *
 * `<OnboardingPanel />` рендерится НАД этим содержимым, пока в конфиге
 * и контенте остаются заглушки шаблона (см. её собственный doc-комментарий
 * в components/dashboard/onboarding-panel.tsx). Она не заменяет главную —
 * та нужна многостраничнику с первого дня, в отличие от лендинга, где
 * главная была единственной страницей, которую ученик потом удалял.
 * Как только заглушек не остаётся, чек-лист возвращает null сам.
 */
export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  return (
    <>
      <OnboardingPanel />
      <main>
        <h1>{SITE.name}</h1>
        {t('meta.site') && <p>{t('meta.site')}</p>}

        <section>
          <h2>{t('nav.services')}</h2>
          <ul>
            {services.map((service) => (
              <li key={service.slug}>
                <Link href={`/uslugi/${service.slug}`}>{service.labels[locale].title}</Link>
                <p>{service.labels[locale].short}</p>
              </li>
            ))}
          </ul>
          <Link href="/uslugi">{t('nav.allServices')}</Link>
        </section>

        <section>
          <h2>{t('nav.contacts')}</h2>
          <p>
            <Link href="/kontakty">{t('nav.contacts')}</Link>
          </p>
          <LeadButton source="home">{t('contacts.lead')}</LeadButton>
        </section>
      </main>
    </>
  )
}
