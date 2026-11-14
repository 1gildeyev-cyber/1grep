import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'
import { absoluteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  // Только под платный трафик: Google Ads обязан просканировать страницу
  // для проверки качества объявления, а органическая выдача — нет.
  if (SITE.indexable === 'ads-only') {
    return {
      rules: [
        { userAgent: 'AdsBot-Google', allow: '/' },
        { userAgent: 'AdsBot-Google-Mobile', allow: '/' },
        { userAgent: '*', disallow: '/' },
      ],
    }
  }

  if (SITE.indexable === 'private') {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  // /spasibo здесь НЕТ намеренно, хотя страница и не должна попадать
  // в поиск. Закрывать обходом страницу, у которой стоит noindex, —
  // ошибка ровно наоборот: робот не может прочитать метатег на странице,
  // которую ему запрещено скачивать, и адрес остаётся в выдаче «без
  // описания». Плюс правило пришлось бы дублировать на каждый язык
  // (/spasibo, /kk/spasibo, …). Из поиска её убирает
  // `robots: { index: false, follow: false }` в самой странице,
  // а из sitemap.xml она не попадает, потому что её нет в logicalPaths().
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/api/' }],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
