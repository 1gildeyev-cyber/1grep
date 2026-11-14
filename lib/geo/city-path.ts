/**
 * Собрать адрес без языка, привязанный к городу.
 *
 *   cityPath('almaty', '/')                  -> '/almaty'
 *   cityPath('almaty', '/uslugi')            -> '/almaty/uslugi'
 *   cityPath('almaty', '/uslugi/santehnik')  -> '/almaty/uslugi/santehnik'
 *   cityPath(null,     '/uslugi/santehnik')  -> '/uslugi/santehnik'
 *
 * Языковой префикс НЕ добавляется: его ставит <Link> из i18n/navigation.
 */
export function cityPath(citySlug: string | null | undefined, path: string): string {
  if (!citySlug) return path
  return path === '/' ? `/${citySlug}` : `/${citySlug}${path}`
}
