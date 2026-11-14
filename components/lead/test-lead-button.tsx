'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

/**
 * Кнопка чек-листа первого экрана (`components/dashboard/onboarding-panel.tsx`):
 * проверяет, доходит ли заявка. Живёт внутри чек-листа и рендерится,
 * только пока в конфиге и контенте остаются заглушки — см. `OnboardingPanel`.
 * Текст — через словарь (namespace `dashboard.leads`): обвязка чек-листа,
 * как и весь остальной интерфейс, обязана говорить на языке текущей
 * страницы, хотя её и увидит только тот, кто собирает сайт.
 */
export function TestLeadButton() {
  const t = useTranslations('dashboard.leads')
  const [result, setResult] = useState<string | null>(null)

  async function send() {
    setResult(t('sending'))
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // source — технический идентификатор, как 'home' или 'sticky-cta'
        // у остальных кнопок: он уезжает в уведомление владельцу сайта
        // и не должен меняться от языка страницы, поэтому латиницей и мимо
        // словаря. А имя — видимый текст, и живёт оно в словаре (правило 2).
        body: JSON.stringify({ name: t('testName'), phone: '+77001234567', source: 'checklist' }),
      })
      const data = await response.json()
      setResult(
        !data.ok
          ? t('failed', { error: data.error ?? t('failedDefault') })
          : data.demo
            ? t('demoOk')
            : data.delivered
              ? t('deliveredOk')
              : t('deliveredWarn'),
      )
    } catch {
      setResult(t('offline'))
    }
  }

  return (
    <div>
      <Button type="button" onClick={send}>{t('button')}</Button>
      {result && <p role="status">{result}</p>}
    </div>
  )
}
