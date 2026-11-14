import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'
import { cities, type City } from '@/lib/content'
import { phoneRaw, phoneText } from '@/lib/phone'
import { pageMeta } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { waLink } from '@/lib/wa'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { LeadButton } from '@/components/lead/lead-button'

type Props = { params: Promise<{ locale: Locale }> }

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return {
    title: t('nav.contacts'),
    ...pageMeta('/kontakty', locale, t('meta.contacts', { name: SITE.name })),
  }
}

/**
 * Страница контактов. Города не имеет — общие контакты всегда из SITE,
 * а филиалы (contacts у города) выводятся отдельным списком, только
 * если у кого-то из городов они реально заполнены.
 */
export default async function Page({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()

  // `cities` — кортеж литералов (см. комментарий у findCity в lib/content/cities.ts):
  // у обоих городов-заглушек `contacts` попросту нет в литерале, а не `undefined`,
  // поэтому TS не видит поле вовсе, пока тип не расширен до `City`.
  const allCities: readonly City[] = cities
  const branches = allCities.filter((city) => city.contacts)

  return (
    <main>
      <Breadcrumbs path="/kontakty" locale={locale} segments={{ kontakty: t('nav.contacts') }} />
      <h1>{t('nav.contacts')}</h1>

      <ul>
        <li>
          {t('contacts.phone')} <a href={`tel:${SITE.primaryPhone.raw}`}>{SITE.primaryPhone.display}</a>
        </li>
        <li>
          <a href={waLink(t('contacts.whatsappText'))} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </li>
        {SITE.telegram && (
          <li>
            <a href={SITE.telegram} target="_blank" rel="noopener noreferrer">Telegram</a>
          </li>
        )}
        {SITE.email && (
          <li>
            {t('contacts.email')} <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </li>
        )}
        {SITE.address.full && <li>{t('contacts.address')} {SITE.address.full}</li>}
        {SITE.hours && <li>{t('contacts.hours')} {SITE.hours}</li>}
        {SITE.mapUrl && (
          <li>
            <a href={SITE.mapUrl} target="_blank" rel="noopener noreferrer">{t('contacts.map')}</a>
          </li>
        )}
      </ul>

      <LeadButton source="kontakty">{t('contacts.lead')}</LeadButton>

      {branches.length > 0 && (
        <section>
          <h2>{t('contacts.branches')}</h2>
          <ul>
            {branches.map((city) => (
              <li key={city.slug}>
                <p>{city.labels[locale].name}</p>
                {city.contacts?.phone && (
                  <p>
                    {t('contacts.phone')}{' '}
                    <a href={`tel:${phoneRaw(city.contacts.phone)}`}>{phoneText(city.contacts.phone)}</a>
                  </p>
                )}
                {city.contacts?.address && <p>{t('contacts.address')} {city.contacts.address}</p>}
                {city.contacts?.hours && <p>{t('contacts.hours')} {city.contacts.hours}</p>}
                {city.contacts?.mapUrl && (
                  <p>
                    <a href={city.contacts.mapUrl} target="_blank" rel="noopener noreferrer">
                      {t('contacts.map')}
                    </a>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
