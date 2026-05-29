// Форматирование и склонения (ru-RU).

const nf = new Intl.NumberFormat("ru-RU");

/** Цена всегда в формате «от ___ ₽» (правило проекта — не e-commerce). */
export function formatPriceFrom(price: number | null | undefined): string {
  if (price == null) return "Цена по запросу";
  return `от ${nf.format(price)} ₽`;
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "—";
  return `${nf.format(price)} ₽`;
}

/** Русское склонение: plural(5, ['отзыв','отзыва','отзывов']) → 'отзывов'. */
export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export function reviewsLabel(n: number): string {
  return `${n} ${plural(n, ["отзыв", "отзыва", "отзывов"])}`;
}

export function sizesAvailableLabel(n: number): string {
  return `Размеров доступно: ${n}`;
}
