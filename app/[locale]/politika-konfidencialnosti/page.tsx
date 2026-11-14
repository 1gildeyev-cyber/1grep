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
  const t = await getTranslations({ locale, namespace: 'privacy' })
  const meta = await getTranslations({ locale, namespace: 'meta' })

  return {
    ...pageMeta('/politika-konfidencialnosti', locale, meta('privacy', { name: SITE.name })),
    title: t('title'),
    robots: { index: false, follow: true },
  }
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('privacy')

  return (
    <main>
      <h1>{t('title')}</h1>

      <p>{t('intro', { legalName: SITE.legalName, bin: SITE.bin, domain: SITE.domain })}</p>

      <h2>{t('collectTitle')}</h2>
      <p>{t('collectText')}</p>

      <h2>{t('purposeTitle')}</h2>
      <p>{t('purposeText')}</p>

      <h2>{t('retentionTitle')}</h2>
      <p>{t('retentionText')}</p>

      <h2>{t('contactTitle')}</h2>
      <p>
        {t('contactText')} <a href={`tel:${SITE.primaryPhone.raw}`}>{SITE.primaryPhone.display}</a>
        {SITE.email && <>, {SITE.email}</>}.
      </p>
      {SITE.legalAddress && <p>{t('address')} {SITE.legalAddress}</p>}
    </main>
  )
}
