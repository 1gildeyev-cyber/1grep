'use client'

import { Phone, MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SITE } from '@/lib/site'
import { waLink } from '@/lib/wa'
import { openLeadModal } from '@/components/lead/modal-controller'

/**
 * Панель связи. Оформления нет — только рабочие ссылки.
 * Свой вид добавь классами Tailwind, когда будешь делать дизайн.
 */
export function StickyCta() {
  const t = useTranslations('contacts')

  return (
    <div role="group" aria-label={t('group')}>
      <a href={`tel:${SITE.primaryPhone.raw}`} data-cta="phone">
        <Phone aria-hidden="true" />
        {t('call')}
      </a>

      <a href={waLink(t('whatsappText'))} target="_blank" rel="noopener noreferrer" data-cta="whatsapp">
        <MessageCircle aria-hidden="true" />
        {/* Название мессенджера — имя собственное, в словаре ему нечего делать. */}
        WhatsApp
      </a>

      <button type="button" onClick={() => openLeadModal('sticky-cta')}>
        {t('lead')}
      </button>
    </div>
  )
}
