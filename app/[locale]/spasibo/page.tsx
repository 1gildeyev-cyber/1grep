import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { SITE } from '@/lib/site'
import { pageMeta } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'thanks' })
  const meta = await getTranslations({ locale, namespace: 'meta' })

  return {
    ...pageMeta('/spasibo', locale, meta('thanks')),
    title: t('title'),
    // Страница благодарности не должна попадать в поиск:
    // человек может зайти на неё мимо формы и решить, что заявка ушла.
    robots: { index: false, follow: false },
  }
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('thanks')

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('text')}</p>
      <p>
        {t('urgent')}{' '}
        <a href={`tel:${SITE.primaryPhone.raw}`}>{SITE.primaryPhone.display}</a>
      </p>
      <Link href="/">{t('home')}</Link>
    </main>
  )
}
