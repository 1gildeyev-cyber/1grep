import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getTranslations } from 'next-intl/server'
import { SITE } from '@/lib/site'
import { routing, type Locale } from '@/i18n/routing'

/**
 * Картинка живёт ВНУТРИ [locale] вместе с главной, а не в корне app/.
 * Из корня она была недостижима: matcher в proxy.ts пропускает мимо себя
 * только пути с точкой в имени, а /opengraph-image точки не имеет —
 * запрос уезжал в языковой сегмент, где файла не было, и адрес отдавал 404.
 * Заодно из сегмента главной Next подмешивает ей полный набор og-тегов сам.
 *
 * generateStaticParams обязателен: без него сегмент динамический, и картинка
 * из ● (собрана на сборке) превращается в ƒ (рисуется на каждый запрос).
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = SITE.name

/**
 * Движок, который рисует эту картинку, НЕ УМЕЕТ кириллицу
 * без явно переданного шрифта — русский текст выйдет квадратами.
 * Поэтому шрифт грузится из public/fonts и кэшируется на модуле.
 */
let fontPromise: Promise<Buffer> | null = null
function loadFont(): Promise<Buffer> {
  fontPromise ??= readFile(join(process.cwd(), 'public/fonts/og.ttf'))
  return fontPromise
}

/**
 * Описание берётся на языке ЭТОЙ картинки, а не одно на весь сайт:
 * файл лежит в языковом сегменте, картинок ровно столько же, сколько
 * языков, и /kk/opengraph-image с русской подписью объявлял бы
 * казахскую страницу русской ровно так же, как это делал бы og:locale.
 */
export default async function Image({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  const description = t('site')
  const font = await loadFont()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#ffffff',
          color: '#0f1720',
          fontFamily: 'OG',
        }}
      >
        <div style={{ fontSize: 68, fontWeight: 700 }}>{SITE.name}</div>
        {description && (
          <div style={{ fontSize: 34, marginTop: 24, color: '#475569' }}>{description}</div>
        )}
      </div>
    ),
    { ...size, fonts: [{ name: 'OG', data: font, style: 'normal', weight: 700 }] },
  )
}
