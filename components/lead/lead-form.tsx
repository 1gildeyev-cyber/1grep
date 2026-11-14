'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PhoneField } from '@/components/lead/phone-field'
import { invalidProps, fieldErrorText, type FormError } from '@/components/lead/lead-field-state'
import { leadSchema } from '@/lib/lead/schema'
import { phoneErrorKey } from '@/components/lead/lead-errors'

type Status = 'idle' | 'sending'
type Field = 'name' | 'phone'

/** Текст ошибки показан под своим полем или под формой — поле только помечаем и связываем с ним. */
const ERROR_ID = 'lead-error'

export function LeadForm({ source, onSuccess }: { source?: string; onSuccess?: () => void }) {
  const t = useTranslations('lead')
  // Роутер из i18n/navigation, а не из next/navigation: обычный увёл бы
  // казахоязычного посетителя на русскую страницу «спасибо».
  const router = useRouter()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<FormError<Field> | null>(null)
  const [phone, setPhone] = useState('')

  function fieldError(field: Field) {
    const text = fieldErrorText(error, field)
    return text ? <p id={ERROR_ID} role="alert">{text}</p> : null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const data = new FormData(event.currentTarget)
    const payload = {
      name: String(data.get('name') ?? ''),
      // В поле лежит форматированная строка для показа — наружу нужен E.164
      // из состояния формы, а не то, что лежит в самом <input>.
      phone,
      comment: String(data.get('comment') ?? ''),
      website: String(data.get('website') ?? ''),
      source,
    }

    // Проверяем на клиенте — чтобы ошибка показалась сразу, без запроса.
    // Текст берём свой, по имени поля: сообщения схемы русские (одна схема
    // на клиент и сервер, а сервер языка запроса не знает).
    const parsed = leadSchema.safeParse(payload)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const field = issue?.path[0]
      setError({
        field: field === 'name' || field === 'phone' ? field : undefined,
        text: field === 'name' ? t('errors.name') : field === 'phone' ? t(phoneErrorKey(issue)) : t('errors.invalid'),
      })
      return
    }

    setStatus('sending')
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        // Роут отвечает кодом причины, а не готовой фразой: фраза у него
        // была бы одноязычной. Русский result.error остаётся для логов.
        setError({ text: result.code === 'rateLimit' ? t('errors.rateLimit') : t('errors.failed') })
        return
      }

      window.dataLayer?.push({ event: 'form_submit', form_source: source })
      onSuccess?.()
      router.push('/spasibo')
    } catch {
      setError({ text: t('errors.offline') })
    } finally {
      setStatus('idle')
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Ловушка для ботов: человек этого поля не видит. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px' }}
      />

      <div>
        <Label htmlFor="lead-name">{t('name')}</Label>
        <Input
          id="lead-name"
          name="name"
          required
          autoComplete="name"
          onChange={() => {
            if (error?.field === 'name') setError(null)
          }}
          {...invalidProps(error, 'name', ERROR_ID)}
        />
        {fieldError('name')}
      </div>

      <div>
        <Label htmlFor="lead-phone">{t('phone')}</Label>
        <PhoneField
          id="lead-phone"
          value={phone}
          onChange={(next) => {
            setPhone(next)
            if (error?.field === 'phone') setError(null)
          }}
          invalid={error?.field === 'phone'}
          describedBy={ERROR_ID}
        />
        {fieldError('phone')}
      </div>

      <div>
        <Label htmlFor="lead-comment">{t('comment')}</Label>
        <Textarea id="lead-comment" name="comment" rows={3} />
      </div>

      {error && !error.field && (
        <p id={ERROR_ID} role="alert">
          {error.text}
        </p>
      )}

      <Button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? t('sending') : t('submit')}
      </Button>
    </form>
  )
}
