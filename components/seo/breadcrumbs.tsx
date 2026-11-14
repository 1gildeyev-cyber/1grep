import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { breadcrumbGraph, breadcrumbTrail } from '@/lib/breadcrumbs'

/**
 * Крошки: видимая навигация и разметка BreadcrumbList из одного источника —
 * цепочки, выведенной из адреса страницы (lib/breadcrumbs.ts). Разойтись
 * с адресом они поэтому не могут, а вести их руками не нужно.
 *
 * Оформления нет намеренно: классы добавляет автор сайта.
 *
 * `path` — тот же логический путь, что уходит в pageMeta: одна строка
 * на страницу, из неё и адрес, и цепочка.
 * `segments` — подписи разделов, которых нет в контенте: { uslugi: 'Услуги' }.
 * Строки приходят из messages/ через getTranslations на странице.
 */
export async function Breadcrumbs({
  path,
  locale,
  segments,
}: {
  path: string
  locale: Locale
  segments?: Record<string, string>
}) {
  const t = await getTranslations({ locale, namespace: 'breadcrumbs' })
  const trail = breadcrumbTrail(path, locale, { home: t('home'), segments })

  // На главной крошек не бывает: цепочка из одного звена — это не навигация.
  if (trail.length < 2) return null

  const last = trail.length - 1

  return (
    <>
      <nav aria-label={t('nav')}>
        <ol>
          {trail.map((crumb, index) => (
            <li key={crumb.path}>
              {index === last ? (
                <span aria-current="page">{crumb.label}</span>
              ) : (
                <Link href={crumb.path}>{crumb.label}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbGraph(trail, locale)) }}
      />
    </>
  )
}
