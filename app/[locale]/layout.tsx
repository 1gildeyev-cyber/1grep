import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import '../globals.css'
import { routing, type Locale } from '@/i18n/routing'
import { SITE } from '@/lib/site'
import { ogLocale, robotsMeta } from '@/lib/seo'
import { Toaster } from '@/components/ui/sonner'
import { LeadModal } from '@/components/lead/lead-modal'
import { StickyCta } from '@/components/layout/sticky-cta'
import { ClickTracker } from '@/components/analytics/click-tracker'
import { SiteAnalytics } from '@/components/analytics/site-analytics'
import { JsonLd } from '@/components/seo/json-ld'
import { CitySwitcher } from '@/components/geo/city-switcher'

/**
 * Корневой layout сайта: <html> и <body> живут здесь, внутри языкового
 * сегмента, а не в app/layout.tsx. Иначе язык страницы неоткуда взять —
 * он приходит параметром маршрута.
 *
 * Общая метадата всех страниц. Здесь НЕТ ни canonical, ни openGraph.url:
 * корневой layout наследуется каждой страницей, и адрес главной молча
 * проставился бы всем остальным. Свой адрес — и в canonical, и в og:url —
 * страница объявляет сама, см. app/[locale]/page.tsx. Остальной openGraph
 * общий, его наследовать как раз правильно.
 *
 * generateMetadata, а не константа: og:locale обязан совпадать с языком
 * страницы. Прибитый SITE.locale объявлял бы казахскую версию русской.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  // Описание — на языке страницы. Одна строка из конфига уехала бы русским
  // текстом на все казахские страницы разом; своё описание каждая страница
  // объявляет сама третьим аргументом pageMeta (см. lib/seo.ts).
  const t = await getTranslations({ locale, namespace: 'meta' })
  const description = t('site') || undefined

  return {
    metadataBase: new URL(SITE.url),
    title: { default: SITE.name, template: `%s — ${SITE.name}` },
    description,
    robots: robotsMeta(),
    openGraph: {
      type: 'website',
      locale: ogLocale(locale),
      siteName: SITE.name,
      title: SITE.name,
      description,
    },
  }
}

/** Языки известны заранее — перечисляем их, чтобы страницы собирались статически. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/**
 * Единственная защита сайта от 500 на мусорном адресе. Не удалять.
 *
 * Matcher в proxy.ts намеренно пропускает мимо себя всё, в чём есть точка
 * (`.*\..*`) — иначе языковая маршрутизация перехватывала бы статику.
 * Значит `/favicon.ico`, `/logo.png`, `/.env`, `/wp-login.php`, `/uslugi.html`
 * приходят в Next БЕЗ языкового префикса, и `[locale]` матчится на них
 * целиком: locale = "favicon.ico". Проверка hasLocale ниже от этого
 * не спасает — layout и page рендерятся параллельно, и page успевает
 * обратиться к `labels["favicon.ico"]` первой. Ответ — 500, а не 404.
 *
 * `dynamicParams = false` отдаёт 404 на стадии маршрутизации, ДО рендера:
 * параметра нет в generateStaticParams — страницы нет. Одно место на весь
 * сайт, поэтому новую страницу нельзя забыть защитить.
 *
 * Настройка распространяется на вложенные сегменты, у которых есть свой
 * generateStaticParams: чужой город и чужая услуга тоже 404 без рендера
 * (их собственные notFound() остаются как страховка и как сужение типа).
 * Сегмент без generateStaticParams остаётся динамическим и рендерится
 * как прежде — новый `[что-то]`-маршрут этой строкой не ломается.
 *
 * Побочный выигрыш: 404 теперь приходит из маршрута /_not-found, то есть
 * из app/not-found.tsx с готовым HTML, а не пустой оболочкой
 * <html id="__next_error__"> (см. «Не принять за баги» п. 12).
 */
export const dynamicParams = false

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Сегмент динамический: в него может прийти что угодно. notFound() берём
  // из next/navigation — это не навигация по сайту, а ответ 404,
  // и языкового варианта у него нет.
  if (!hasLocale(routing.locales, locale)) notFound()

  // Без этой строки всё под layout рендерится на каждый запрос,
  // а не собирается статически.
  setRequestLocale(locale)

  return (
    <html lang={locale}>
      <body>
        {/* Провайдер без пропсов забирает язык и словарь из i18n/request.ts
            и отдаёт их клиентским компонентам ниже — весь словарь целиком,
            включая namespace dashboard, который нужен чек-листу первого экрана
            первого запуска. Сузить набор через pick() можно, но тогда
            КАЖДЫЙ новый клиентский компонент автора сайта обязан не забыть
            дописать свой namespace в этот список, иначе упадёт в рантайме
            на отсутствующем ключе. Для шаблона, который собирают учась,
            пара килобайт JSON дешевле такой ловушки. */}
        <NextIntlClientProvider>
          <JsonLd locale={locale} />
          {/* Без обёртки-шапки: макет добавляет автор сайта. Переключатель
              живёт над контентом на каждой странице, чтобы город менялся
              и с общих, и с городских страниц. */}
          <CitySwitcher />
          {children}
          <StickyCta />
          <LeadModal />
          <ClickTracker />
          <SiteAnalytics />
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
