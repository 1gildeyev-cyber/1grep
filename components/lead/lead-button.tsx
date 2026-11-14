'use client'

import type { ReactNode } from 'react'
import { openLeadModal } from '@/components/lead/modal-controller'

/**
 * Кнопка заявки для страниц контента: услуги, контакты и (позже)
 * городские страницы. Открывает ту же модалку, что и StickyCta, через
 * общую событийную шину — без своего состояния и без API формы.
 *
 * `source` уходит в заявку как отметка, с какой страницы пришёл
 * посетитель (см. lib/lead/schema.ts) — полезно для статистики,
 * какая страница приводит заявки.
 */
export function LeadButton({ source, children }: { source?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={() => openLeadModal(source)}>
      {children}
    </button>
  )
}
