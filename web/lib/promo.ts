import "server-only";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // без похожих символов

function randomPart(len = 6): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export function generatePromoCode(prefix?: string | null): string {
  const p = (prefix || "PROMO").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${p}-${randomPart()}`;
}

/** Уникальный код: генерируем, пока isTaken не вернёт false (с ограничением попыток). */
export async function createUniquePromoCode(
  prefix: string | null | undefined,
  isTaken: (code: string) => Promise<boolean>,
): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generatePromoCode(prefix);
    if (!(await isTaken(code))) return code;
  }
  // крайне маловероятный фолбэк
  return `${generatePromoCode(prefix)}${randomPart(2)}`;
}
