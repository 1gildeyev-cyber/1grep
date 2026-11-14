/** Ошибка формы: текст и, если она про конкретное поле, какое. */
export type FormError<Field extends string> = { field?: Field; text: string }

/** aria-атрибуты для невалидного поля — спред на инпут. */
export function invalidProps<Field extends string>(
  error: FormError<Field> | null,
  field: Field,
  errorId: string,
): Record<string, unknown> {
  return error?.field === field ? { 'aria-invalid': true, 'aria-describedby': errorId } : {}
}

/** Текст ошибки для конкретного поля — null, если текущая ошибка не про него. */
export function fieldErrorText<Field extends string>(error: FormError<Field> | null, field: Field): string | null {
  return error?.field === field ? error.text : null
}
