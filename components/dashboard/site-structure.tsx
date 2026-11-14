import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { cities, pairsWithoutText, services } from '@/lib/content'
import { matrixSize } from '@/lib/matrix'

/**
 * Два блока чек-листа, которых в шаблоне лендинга нет и быть не может:
 * цифры структуры многостраничника. Они не про то, что принести, а про то,
 * во что превратится принесённое, — поэтому стоят ниже самого чек-листа
 * и живой галочки не имеют: отмечать тут нечего.
 *
 * Команд и путей к файлам здесь тоже нет — по той же причине, что и в
 * `onboarding-panel.tsx`: экран читает человек, который ещё не открывал
 * редактор.
 *
 * `matrixSize()` = число логических путей × число языков. Не совпадает
 * ни с `sitemap.xml` (там меньше — юрстраницы noindex, см. `NOINDEX_PATHS`
 * в `lib/matrix.ts`), ни с выводом `next build` (там больше — sitemap,
 * robots, картинка превью, /spasibo, служебные роуты). Поэтому текст
 * в словаре не называет проверяемый артефакт («в карте сайта»,
 * «соберётся»), а только сам расчёт: иначе автор сайта сверил бы число
 * с другим инструментом и решил, что что-то разошлось.
 */
export async function SiteStructure() {
  const t = await getTranslations('dashboard')

  const pageCount = matrixSize()
  const serviceSlugs: string[] = services.map((service) => service.slug)
  const citySlugs: string[] = cities.map((city) => city.slug)
  const missingPairs = pairsWithoutText(serviceSlugs, citySlugs, routing.locales)
  const totalPairs = serviceSlugs.length * citySlugs.length * routing.locales.length

  return (
    <>
      <div className="space-y-2 border-t pt-6">
        <h2 className="text-xl font-semibold">{t('geo.heading')}</h2>
        <p>{t('geo.languages', { count: routing.locales.length, locale: routing.defaultLocale })}</p>
        <p>{t('geo.matrix', { cities: cities.length, services: services.length, pages: pageCount })}</p>
        {pageCount > 500 ? <p>{t('geo.warning')}</p> : null}
      </div>

      <div className="space-y-2 border-t pt-6">
        <h2 className="text-xl font-semibold">{t('pairs.heading')}</h2>
        <p>{t('pairs.text', { missing: missingPairs.length, total: totalPairs })}</p>
        <p className="text-sm opacity-70">{t('pairs.why')}</p>
      </div>
    </>
  )
}
