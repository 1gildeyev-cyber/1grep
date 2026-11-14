import { getTranslations } from 'next-intl/server'
import { getPathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

/**
 * Единственная 404 сайта, и лежит она ВНЕ сегмента [locale].
 * Так вышло не от лени — так себя повёл Next 16.3.2, когда корневой layout
 * переехал в app/[locale]/layout.tsx. Проверено сборкой и curl:
 *
 * 1. Layout'а вне языкового сегмента у сайта больше нет, и сборку это
 *    не ломает: на маршрут /_not-found Next подставляет собственный
 *    корневой layout. <html> и <body> приходят оттуда, поэтому их здесь
 *    нет — свои дали бы второй <html> внутри первого. Цена — у этой
 *    страницы (и только у неё) нет атрибута lang.
 * 2. Вложенный app/[locale]/not-found.tsx серверно НЕ рендерится: любой
 *    notFound() внутри [locale] отдаёт пустую оболочку
 *    <html id="__next_error__"> с дорисовкой на клиенте. Поэтому такого
 *    файла в шаблоне нет: он выглядел бы рабочим, но не работал.
 * 3. app/global-not-found.tsx (конвенция Next 16) требует
 *    experimental.globalNotFound — по умолчанию флаг выключен, и без него
 *    Next файл игнорирует. Экспериментальные флаги в шаблон не тащим.
 *
 * Страница всегда на основном языке. Язык посетителя лежит в куке
 * NEXT_LOCALE, которую ставит proxy.ts, но читать её здесь нельзя:
 * not-found входит в дерево КАЖДОГО маршрута, и один cookies() в ней
 * переводит весь сайт из статики в рендер на каждый запрос — в таблице
 * маршрутов ● превращаются в ƒ.
 */
export default async function NotFound() {
  const locale = routing.defaultLocale
  const t = await getTranslations({ locale, namespace: 'notFound' })

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('text')}</p>
      {/* Обычная <a>, а не <Link>: страница живёт вне провайдера next-intl. */}
      <a href={getPathname({ href: '/', locale })}>{t('home')}</a>
    </main>
  )
}
