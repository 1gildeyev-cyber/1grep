import { NextResponse } from 'next/server'
import { leadSchema } from '@/lib/lead/schema'
import { sendLead } from '@/lib/lead/providers/telegram'
import { checkRateLimit } from '@/lib/lead/rate-limit'

/**
 * Ответ об ошибке. `code` — для интерфейса: форма переводит его сама,
 * потому что роут языка запроса не знает. `error` — русский текст
 * для логов и для клиентов без своего словаря.
 */
function fail(code: 'badRequest' | 'invalid' | 'rateLimit', error: string, status: number) {
  return NextResponse.json({ ok: false, code, error }, { status })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('badRequest', 'Некорректный запрос', 400)
  }

  // Ловушка для ботов: поле скрыто от человека, но заполняется автозаполнением бота.
  // Отвечаем успехом, чтобы бот не искал обход, но ничего не отправляем.
  if (typeof body === 'object' && body !== null && 'website' in body && body.website) {
    return NextResponse.json({ ok: true })
  }

  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) {
    return fail('invalid', parsed.error.issues[0]?.message ?? 'Проверьте поля формы', 400)
  }

  // Лимит считает только состоявшиеся заявки и потому стоит ПОСЛЕ проверки.
  // Стоял бы раньше — мусорные тела съедали бы квоту, и человек с корректной
  // заявкой получал бы «слишком много заявок», не отправив ни одной.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return fail('rateLimit', 'Слишком много заявок. Попробуйте через минуту.', 429)
  }

  try {
    const { demo, delivered } = await sendLead(parsed.data)
    return NextResponse.json({ ok: true, demo, delivered })
  } catch (error) {
    // Заявка не должна пропасть даже при падении провайдера.
    console.error('[lead] провайдер упал:', error, parsed.data)
    return NextResponse.json({ ok: true, demo: false, delivered: false })
  }
}
