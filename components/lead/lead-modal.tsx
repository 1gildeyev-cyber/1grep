'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { onLeadModalOpen } from '@/components/lead/modal-controller'
import { LeadFormBoundary } from '@/components/lead/lead-form-boundary'

function LeadFormLoading() {
  const t = useTranslations('lead')
  return <p>{t('loading')}</p>
}

// Форма с библиотекой телефона весит больше остальной страницы: грузим её
// отдельным чанком в момент открытия модалки, а не на первой загрузке.
// Не превращать обратно в статический импорт — First Load JS вырастет
// на десятки килобайт у каждого сайта, снятого с шаблона.
const LeadForm = dynamic(() => import('@/components/lead/lead-form').then((m) => m.LeadForm), {
  ssr: false,
  loading: () => <LeadFormLoading />,
})

export function LeadModal() {
  const t = useTranslations('lead')
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<string | undefined>()

  useEffect(
    () =>
      onLeadModalOpen((nextSource) => {
        setSource(nextSource)
        setOpen(true)
      }),
    [],
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <LeadFormBoundary fallback={<p role="alert">{t('loadFailed')}</p>}>
          <LeadForm source={source} onSuccess={() => setOpen(false)} />
        </LeadFormBoundary>
      </DialogContent>
    </Dialog>
  )
}
