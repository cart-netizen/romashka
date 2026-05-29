import "server-only";

// Уведомления через MAX. Без ключей — no-op + лог (запись в БД не теряется).

const API_BASE = (process.env.MAX_API_BASE ?? "https://platform-api.max.ru").replace(/\/$/, "");
const BOT_TOKEN = process.env.MAX_BOT_TOKEN || "";
const ADMIN_CHAT_ID = process.env.MAX_ADMIN_CHAT_ID || "";
const NOTIFY_TOKEN = process.env.MAX_NOTIFY_TOKEN || "";

export interface ChannelResult {
  sent: boolean;
  skipped?: string;
  error?: string;
}

/** Уведомление администратору через бота MAX. */
export async function sendMaxNotification(text: string): Promise<ChannelResult> {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.info("[max] пропущено: MAX_BOT_TOKEN/MAX_ADMIN_CHAT_ID не заданы");
    return { sent: false, skipped: "no-keys" };
  }
  try {
    const res = await fetch(
      `${API_BASE}/messages?access_token=${encodeURIComponent(BOT_TOKEN)}&chat_id=${encodeURIComponent(ADMIN_CHAT_ID)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { sent: true };
  } catch (e) {
    console.error("[max] ошибка отправки уведомления:", (e as Error).message);
    return { sent: false, error: (e as Error).message };
  }
}

/**
 * Доставка промокода по номеру телефона (бизнес-уведомления MAX).
 * Точный метод бизнес-API уточняется заказчиком — при наличии ключа делаем
 * best-effort вызов, без ключа — no-op + лог.
 */
export async function sendMaxPhoneCode(phone: string, text: string): Promise<ChannelResult> {
  if (!NOTIFY_TOKEN) {
    console.info(`[max] доставка кода по телефону ${phone} пропущена: MAX_NOTIFY_TOKEN не задан`);
    return { sent: false, skipped: "no-keys" };
  }
  try {
    // TODO: заменить на точный эндпоинт бизнес-уведомлений MAX из документации заказчика.
    const res = await fetch(`${API_BASE}/notifications?access_token=${encodeURIComponent(NOTIFY_TOKEN)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, text }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { sent: true };
  } catch (e) {
    console.error("[max] ошибка доставки кода по телефону:", (e as Error).message);
    return { sent: false, error: (e as Error).message };
  }
}
