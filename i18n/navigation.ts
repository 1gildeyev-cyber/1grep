import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Единственный источник навигации в проекте.
 * next/link и next/navigation напрямую не использовать: они не знают
 * про языковой префикс и уведут пользователя на чужой язык.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
