import type { Metadata } from 'next'
import { routing, type Locale } from '@/i18n/routing'
import { SITE } from '@/lib/site'

/**
 * Дата последнего значимого изменения сайта.
 * Правится вручную. НЕ подставлять сюда new Date():
 * тогда при каждой сборке все страницы объявляются изменёнными,
 * и поисковик перестаёт доверять этому сигналу.
 */
export const LAST_UPDATED = '2026-08-21'

/** Канонический адрес: https, без www, без хвостового слеша. */
export function absoluteUrl(path: string): string {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`
  const trimmed = withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : ''
  return `${SITE.url}${trimmed}`
}

/**
 * Абсолютный адрес логического пути на конкретном языке.
 * Основной язык живёт без префикса — так же, как это делает proxy.ts.
 * Здесь и в маршрутизации правило должно совпадать буквально,
 * иначе canonical покажет на адрес, которого нет.
 */
export function localizedUrl(logicalPath: string, locale: Locale): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  const path = logicalPath === '/' ? '' : logicalPath
  return absoluteUrl(`${prefix}${path}` || '/')
}

/**
 * Языковой тег страницы в общепринятом виде: «<язык>-<РЕГИОН>», ru-KZ.
 * Регион у сайта один и берётся из SITE.locale ('ru_KZ' → 'KZ'),
 * а язык — от самой страницы. Прибитая константа объявляла бы
 * казахскую страницу русской.
 *
 * Единственный источник языка для всех, кто его объявляет: og:locale
 * ниже и inLanguage в components/seo/json-ld.tsx. Разойтись они не могут
 * по построению — а разойдясь, показали бы поисковику метатеги
 * на одном языке и разметку на другом.
 */
export function languageTag(locale: Locale): string {
  const region = SITE.locale.split('_')[1]
  return region ? `${locale}-${region}` : locale
}

/** Тот же тег, но через подчёркивание: так его требует Open Graph. */
export function ogLocale(locale: Locale): string {
  return languageTag(locale).replace('-', '_')
}

/**
 * Адрес страницы для метадаты: canonical и og:url всегда один и тот же,
 * и всегда — адрес ЭТОЙ страницы на ЕЁ языке. Второй параметр обязателен
 * именно поэтому: без него казахская страница объявляла бы каноническим
 * адресом русскую и вычёркивала себя из индекса.
 *
 * Ставится НА КАЖДОЙ странице — в корневом layout его быть не может,
 * layout наследуется всеми, и адрес главной молча достался бы остальным.
 * Язык приходит параметром маршрута, поэтому метадата страницы — это
 * generateMetadata, а не export const metadata.
 *
 * Общие поля openGraph повторены здесь, а не оставлены в layout, потому
 * что Next сливает метадату ПОВЕРХНОСТНО: объект openGraph страницы
 * заменяет layout'овский целиком. Объяви страница один только url —
 * og:site_name, og:locale и og:type пропадут из её HTML.
 *
 * По той же причине картинку превью приходится подставлять руками:
 * общая из app/[locale]/opengraph-image.tsx подмешивается только туда, где
 * свой openGraph не объявлен (resolve-metadata.js, mergeStaticMetadata).
 * Исключение — главная: файл лежит в её сегменте, и если НЕ задавать ей
 * images, Next соберёт картинку сам, со всеми размерами, alt, типом
 * и хешем для сброса кэша соцсетей. Поэтому корень получает картинку
 * автоматически, а все остальные пути — тот же адрес явной строкой.
 * Хеша в нём нет намеренно: картинка на всём сайте одна, и кэш её
 * как раз должен переиспользовать.
 *
 * «Корень» здесь — логический путь, а не готовый адрес: главная есть
 * на КАЖДОМ языке (/ и /kk), и автогенерацию картинки нельзя отдавать
 * только основному. Сравнение готового адреса с адресом главной
 * на языке по умолчанию отобрало бы у /kk размеры, alt и тип.
 *
 * Третий аргумент — описание ЭТОЙ страницы на ЕЁ языке. Оно приходит
 * готовой строкой, а не ключом: у страниц шаблона описание собирается
 * из материала, который уже существует на каждом языке (`meta.*`
 * в messages/<язык>.json плюс labels городов и услуг из lib/content),
 * и складывать его умеет только сама страница.
 *
 * Пустую строку не выводим: описания нет — нет и тега. Пустой
 * `<meta name="description" content="">` хуже отсутствующего, а
 * подставить сюда описание с другого языка нельзя тем более.
 *
 * description и og:description ставятся ЗДЕСЬ ВМЕСТЕ и только здесь.
 * Врозь их разносить нельзя: объект openGraph страницы затирает
 * layout'овский (см. абзац выше), поэтому страница, объявившая
 * описание одним полем `description`, осталась бы с og:description
 * от layout — то есть с описанием всего сайта на карточке услуги.
 */
export function pageMeta(logicalPath: string, locale: Locale, description?: string): Metadata {
  const url = localizedUrl(logicalPath, locale)
  const isRoot = logicalPath === '/' || logicalPath === ''
  const withDescription = description ? { description } : {}

  // hreflang во все стороны плюс x-default на язык по умолчанию.
  const languages: Record<string, string> = {}
  for (const other of routing.locales) languages[other] = localizedUrl(logicalPath, other)
  languages['x-default'] = localizedUrl(logicalPath, routing.defaultLocale)

  // og:locale:alternate — тот же сигнал, что hreflang, но для соцсетей.
  // Пустым не выводим: пустое значение хуже отсутствующего.
  const alternateLocale = routing.locales.filter((other) => other !== locale).map(ogLocale)

  return {
    alternates: { canonical: url, languages },
    ...withDescription,
    openGraph: {
      type: 'website',
      locale: ogLocale(locale),
      ...(alternateLocale.length > 0 ? { alternateLocale } : {}),
      siteName: SITE.name,
      url,
      ...withDescription,
      ...(isRoot ? {} : { images: [absoluteUrl('/opengraph-image')] }),
    },
  }
}

/** Пускать ли в органическую выдачу. */
export function isIndexable(): boolean {
  return SITE.indexable === 'public'
}

export function robotsMeta(): { index: boolean; follow: boolean } {
  const allowed = isIndexable()
  return { index: allowed, follow: allowed }
}
