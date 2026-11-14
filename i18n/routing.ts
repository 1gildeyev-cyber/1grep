import { defineRouting } from 'next-intl/routing'
import { SITE } from '@/lib/site'

/**
 * Языки берутся из SITE — единственного конфига сайта.
 * localePrefix: 'as-needed' значит, что основной язык живёт без префикса,
 * а /ru редиректит на /. Двух адресов у одной страницы не возникает.
 */
export const routing = defineRouting({
  locales: SITE.locales,
  defaultLocale: SITE.defaultLocale,
  localePrefix: 'as-needed',

  // Никаких редиректов по Accept-Language: ссылка обязана открывать
  // ровно ту страницу, которую дали. Автоперевод адреса на язык браузера
  // вместе с объявленным hreflang — прямая антирекомендация Google,
  // а человека он ставит в тупик: открыл /, попал на /kk и решил,
  // что сломал маршрутизацию. Язык посетитель выбирает переключателем,
  // тот работает через адрес и в детекте не нуждается.
  localeDetection: false,
})

export type Locale = (typeof SITE.locales)[number]
