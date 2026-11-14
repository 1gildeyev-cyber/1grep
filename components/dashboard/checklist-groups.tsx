'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChecklistGroup } from '@/lib/checklist'
import { readTicks, writeTick, type Ticks } from '@/lib/checklist-ticks'

/**
 * Список пунктов чек-листа. Классы оформления здесь есть — это то самое
 * исключение из правила «дизайна в шаблоне нет», объяснённое в
 * `onboarding-panel.tsx`: отступы, размер чекбокса и приглушённая
 * подпись у уже записанного. Ни цветов, ни новых токенов.
 *
 * Одиночное поле, заполненное в брифе, отмечено и заблокировано: данные
 * пришли, собирать нечего. Всё остальное — живой чекбокс «я это собрал»,
 * его состояние лежит в localStorage (`lib/checklist-ticks.ts`).
 * У свёрнутого пункта рядом стоит, сколько штук уже записано: сам он
 * не отмечается, потому что «сколько нужно» знает только человек —
 * см. `foldSection` в `lib/checklist-fold.ts`.
 *
 * Компонентных тестов у этого файла нет: jsdom в шаблоне не заведён,
 * `vitest` работает в окружении `node`. Известный предел — поведение
 * галочек закрыто тестами на уровне хранилища
 * (`tests/checklist-ticks.test.ts`) и проверкой в настоящем браузере.
 *
 * Названия групп и подписи пунктов приходят из `brief.md` и остаются
 * русскими на всех языковых версиях — переводится обвязка, а не бриф.
 * Почему так, разобрано в `lib/checklist.ts`, раздел «ЯЗЫК».
 */
export function ChecklistGroups({ groups }: { groups: ChecklistGroup[] }) {
  const t = useTranslations('dashboard')
  const [ticks, setTicks] = useState<Ticks>({})

  // Хранилище читается ТОЛЬКО после монтирования. Компонент статически
  // пререндерен: прочитай мы localStorage в первом рендере — разметка
  // сервера и клиента разошлись бы, и React перерисовал бы дерево целиком.
  useEffect(() => setTicks(readTicks()), [])

  // Списков на экране два — «собрать сейчас» и «перед запуском», — и у
  // каждого своя копия `ticks`. Чужие ключи в ней устаревшие, поэтому
  // хранилищу отдаётся ТОЛЬКО тронутый пункт — `writeTick` другого и не
  // принимает: отдать набор целиком нельзя по типу, и стереть галочку
  // соседнего списка некому (см. `lib/checklist-ticks.ts`).
  function toggle(id: string, on: boolean): void {
    setTicks({ ...ticks, [id]: on })
    writeTick(id, on)
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.name}>
          <h3 className="mb-2 font-semibold">{group.name}</h3>
          <ul className="space-y-1.5">
            {group.items.map((item) => (
              <li key={item.id}>
                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0"
                    checked={item.done || ticks[item.id] === true}
                    disabled={item.done}
                    onChange={(event) => toggle(item.id, event.target.checked)}
                  />
                  <span className={item.done ? 'opacity-60' : undefined}>
                    {item.label}
                    {item.done ? <span className="text-sm">{t('fromBrief')}</span> : null}
                    {item.inBrief > 0 ? (
                      <span className="text-sm opacity-70">{t('inBrief', { count: item.inBrief })}</span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
