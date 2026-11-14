import type { Labeled, ServiceLabels } from './types'

export type Service = {
  slug: string
  /** Цена «от». Пусто — на странице будет «по запросу». */
  price?: { from: number; currency: 'KZT' }
  labels: Labeled<ServiceLabels>
}

/**
 * Услуги сайта. Две услуги-заглушки приехали в шаблоне: вместе с двумя
 * городами они дают видимую матрицу из четырёх страниц на язык.
 */
export const services = [
  {
    slug: 'usluga-odna',
    price: { from: 5000, currency: 'KZT' },
    labels: {
      ru: {
        title: 'Услуга Одна',
        short: 'Короткое описание первой услуги — одна строка для карточки.',
        body: 'Текст страницы первой услуги. Замени его на своё описание.',
      },
      kk: {
        title: 'Бірінші Қызмет',
        short: 'Бірінші қызметтің қысқаша сипаттамасы — карточкаға арналған бір жол.',
        body: 'Бірінші қызмет бетінің мәтіні. Оны өз сипаттамаңызбен ауыстырыңыз.',
      },
    },
  },
  {
    slug: 'usluga-dva',
    labels: {
      ru: {
        title: 'Услуга Две',
        short: 'Короткое описание второй услуги.',
        body: 'Текст страницы второй услуги. У неё намеренно нет цены — так выглядит «по запросу».',
      },
      kk: {
        title: 'Екінші Қызмет',
        short: 'Екінші қызметтің қысқаша сипаттамасы.',
        body: 'Екінші қызмет бетінің мәтіні. Оның бағасы әдейі көрсетілмеген — бұл «сұраныс бойынша» дегенді білдіреді.',
      },
    },
  },
] as const satisfies readonly Service[]

export type ServiceSlug = (typeof services)[number]['slug']

export function findService(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug)
}
