import "server-only";

// Серверная запись в Directus. С админ-токеном — полный доступ (промо-поля,
// чтение записи, проверка уникальности). Без токена — фолбэк на публичный
// create (запись сохраняется; промо-поля недоступны публичной роли).

const DIRECTUS_URL = (process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/$/, "");
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || "";

export function hasAdminToken(): boolean {
  return ADMIN_TOKEN.length > 0;
}

const isAuthError = (status: number) => status === 401 || status === 403;

interface RawResult {
  ok: boolean;
  status: number;
  data: unknown;
  detail: string;
}

async function rawWrite(path: string, method: "POST" | "PATCH", body: object, auth: boolean): Promise<RawResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth && ADMIN_TOKEN) headers.Authorization = `Bearer ${ADMIN_TOKEN}`;
  const res = await fetch(`${DIRECTUS_URL}${path}`, { method, headers, body: JSON.stringify(body), cache: "no-store" });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return { ok: res.ok, status: res.status, data: json?.data ?? null, detail: json?.errors ? JSON.stringify(json.errors) : text };
}

/**
 * Запись с устойчивостью к невалидному токену. Если токен задан — пишем
 * авторизованно (полные поля); при ошибке авторизации (401/403) НЕ теряем
 * запись, а повторяем публичным create с урезанным телом (`publicBody`).
 * Без токена сразу пишем публично. Возвращает viaPublic — упали ли в фолбэк.
 */
async function writeResilient<T>(
  path: string,
  method: "POST" | "PATCH",
  authedBody: object,
  publicBody: object,
): Promise<{ data: T | null; viaPublic: boolean }> {
  if (ADMIN_TOKEN) {
    const r = await rawWrite(path, method, authedBody, true);
    if (r.ok) return { data: r.data as T, viaPublic: false };
    if (!isAuthError(r.status)) {
      throw new Error(`Directus write ${path} → ${r.status}: ${r.detail}`);
    }
    console.warn(
      `[directus-write] авторизация отклонена (${r.status}) на ${path} — фолбэк на публичную запись. Проверьте DIRECTUS_ADMIN_TOKEN (токен должен быть привязан к пользователю Directus).`,
    );
  }
  const pub = await rawWrite(path, method, publicBody, false);
  if (!pub.ok) {
    throw new Error(`Directus write ${path} (public) → ${pub.status}: ${pub.detail}`);
  }
  return { data: pub.data as T, viaPublic: true };
}

export interface LeadRecord {
  name?: string;
  phone: string;
  email?: string;
  message?: string;
  product?: number;
  selected_size?: string;
  source_page?: string;
  type: string;
}

export async function createLead(data: LeadRecord): Promise<void> {
  // Поля лида разрешены публичной роли — фолбэк-тело совпадает с авторизованным.
  await writeResilient("/items/leads", "POST", data, data);
}

export interface SubscriberRecord {
  contact: string;
  consent: boolean;
  source_page?: string;
  promo_code?: string;
  promo_channel?: "email" | "max";
  promo_sent_at?: string | null;
  promo_status?: "issued" | "redeemed";
}

export async function createSubscriber(data: SubscriberRecord): Promise<{ id: number | null; viaPublic: boolean }> {
  // Промо-поля доступны только по токену. Публичное тело (фолбэк при невалидном
  // токене и путь без токена) — только базовые поля, разрешённые public-роли.
  const publicBody = { contact: data.contact, consent: data.consent, source_page: data.source_page };
  const { data: result, viaPublic } = await writeResilient<{ id: number } | null>(
    "/items/subscribers",
    "POST",
    data,
    publicBody,
  );
  return { id: result?.id ?? null, viaPublic };
}

/** Проверка занятости промокода (только при наличии токена; иначе считаем свободным). */
export async function isPromoCodeTaken(code: string): Promise<boolean> {
  if (!ADMIN_TOKEN) return false;
  const res = await fetch(
    `${DIRECTUS_URL}/items/subscribers?filter[promo_code][_eq]=${encodeURIComponent(code)}&fields=id&limit=1`,
    { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }, cache: "no-store" },
  );
  if (!res.ok) return false;
  const json = await res.json();
  return Array.isArray(json.data) && json.data.length > 0;
}

/** Серверное чтение настроек (для промо-сумм/префикса) без зависимости от server-only клиента. */
export async function getSettingsForServer(): Promise<{
  promo_amount: number | null;
  promo_code_prefix: string | null;
  promo_static_code: string | null;
}> {
  const res = await fetch(`${DIRECTUS_URL}/items/site_settings?fields=promo_amount,promo_code_prefix,promo_static_code`, {
    cache: "no-store",
  });
  if (!res.ok) return { promo_amount: null, promo_code_prefix: null, promo_static_code: null };
  const json = await res.json();
  return json.data ?? { promo_amount: null, promo_code_prefix: null, promo_static_code: null };
}
