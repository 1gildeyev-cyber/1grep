import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { readChecklist } from '@/lib/checklist'
import { cities, services } from '@/lib/content'
import { PLACEHOLDER_LIST } from '@/lib/placeholders'
import { SITE } from '@/lib/site'
import { TestLeadButton } from '@/components/lead/test-lead-button'
import { ChecklistGroups } from '@/components/dashboard/checklist-groups'
import { SiteStructure } from '@/components/dashboard/site-structure'

/**
 * Первый экран форкнутого шаблона: чек-лист того, что собрать до начала
 * работы. Рендерится НАД содержимым главной, пока в `lib/site.ts` или
 * в контенте (`lib/content/cities.ts`, `lib/content/services.ts`) остаётся
 * хоть одна заглушка из `PLACEHOLDER_LIST`. Как только их не остаётся —
 * возвращает `null`, и главная выглядит как обычная главная. Удалять
 * руками нечего.
 *
 * `remaining` сверяется со ВСЕМ `PLACEHOLDER_LIST` (восемнадцать записей:
 * шесть в `lib/site.ts`, шесть у городов, шесть у услуг), а не с
 * подмножеством, — но это всё равно **слабее** guard-теста, и знать об этом
 * надо: чек-лист смотрит на поля данных, а guard сканирует `lib/ app/
 * components/ scripts/ public/` целиком. Заглушка, оставшаяся где-нибудь
 * вне этих полей, чек-лист не удержит: он исчезнет, а `pnpm test` останется
 * красным. Так и задумано — чек-лист про конфиг и служит подсказкой,
 * а судья готовности один, и это `pnpm test`.
 *
 * Автор сайта видит этот экран на временном домене Vercel РАНЬШЕ, чем
 * открывает редактор: путь на самом деле такой — Use this template →
 * Deploy → клон в VS Code → разговор с Claude. Поэтому здесь нет ни одной
 * команды, ни одного пути к файлу и ни слова про терминал: это экран для
 * человека, который собирает материалы, а не запускает сборку.
 *
 * ОФОРМЛЕНИЕ — единственное исключение из правила «дизайна в шаблоне нет»,
 * и вот почему: экран исчезает вместе с заглушками, то есть до того, как
 * у сайта появится собственный дизайн, — а прочитать его должен человек,
 * которому читать пока нечего кроме него. Разрешено минимально: отступы,
 * читаемая ширина колонки, различимые группы, нормальные чекбоксы.
 * Классы живут ТОЛЬКО внутри `components/dashboard/*`; ни цветов,
 * ни новых токенов здесь не заводится.
 */
export async function OnboardingPanel() {
  // Аннотация `string[]` обязательна: SITE закрыт `as const`, поля имеют
  // литеральные типы, и без расширения сравнение со строкой — ошибка TS2367
  // ровно с того момента, как автор сайта заполнит site.ts.
  const siteValues: string[] = [
    SITE.domain,
    SITE.primaryPhone.display,
    SITE.whatsapp.number,
    SITE.bin,
    SITE.name,
    SITE.legalName,
  ]
  const contentValues: string[] = [
    ...cities.flatMap((city) => [city.slug, ...routing.locales.map((locale) => city.labels[locale].name)]),
    ...services.flatMap((service) => [
      service.slug,
      ...routing.locales.map((locale) => service.labels[locale].title),
    ]),
  ]
  const remaining = PLACEHOLDER_LIST.filter(
    (placeholder) => siteValues.includes(placeholder.value) || contentValues.includes(placeholder.value),
  )
  if (remaining.length === 0) return null

  const t = await getTranslations('dashboard')
  const { now, later } = readChecklist()

  return (
    <section className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">{t('title')}</h2>
        <p>{t('intro')}</p>
        <p className="text-sm opacity-70">{t('fromBriefNote')}</p>
      </div>

      {now.length === 0 && later.length === 0 ? <p>{t('noBrief')}</p> : null}

      <ChecklistGroups groups={now} />

      {later.length > 0 ? (
        <div className="space-y-3 border-t pt-6">
          <h2 className="text-xl font-semibold">{t('laterTitle')}</h2>
          <p className="text-sm opacity-70">{t('laterNote')}</p>
          <ChecklistGroups groups={later} />
        </div>
      ) : null}

      <div className="space-y-2 border-t pt-6">
        <h2 className="text-xl font-semibold">{t('leads.heading')}</h2>
        <p>{t('leads.text')}</p>
        <TestLeadButton />
      </div>

      <SiteStructure />

      <p className="border-t pt-6">{t('next')}</p>
    </section>
  )
}
