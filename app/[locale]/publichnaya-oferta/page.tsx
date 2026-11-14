import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'
import { SITE } from '@/lib/site'
import { pageMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'offer' })
  const meta = await getTranslations({ locale, namespace: 'meta' })

  return {
    ...pageMeta('/publichnaya-oferta', locale, meta('offer', { name: SITE.name })),
    title: t('title'),
    robots: { index: false, follow: true },
  }
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('offer')

  return (
    <main>
      <h1>{t('title')}</h1>

      <p>{t('intro', { legalName: SITE.legalName, bin: SITE.bin, domain: SITE.domain })}</p>

      <h2>{t('subjectTitle')}</h2>
      <p>{t('subjectText', { domain: SITE.domain })}</p>

      <h2>{t('orderTitle')}</h2>
      <p>{t('orderText')}</p>

      <h2>{t('priceTitle')}</h2>
      <p>{t('priceText')}</p>

      <h2>{t('liabilityTitle')}</h2>
      <p>{t('liabilityText')}</p>

      <h2>{t('detailsTitle')}</h2>
      <p>{SITE.legalName}</p>
      <p>{t('bin')} {SITE.bin}</p>
      {SITE.legalAddress && <p>{t('address')} {SITE.legalAddress}</p>}
      <p>
        {t('phone')} <a href={`tel:${SITE.primaryPhone.raw}`}>{SITE.primaryPhone.display}</a>
      </p>
      {SITE.email && <p>{t('email')} {SITE.email}</p>}
    </main>
  )
}
