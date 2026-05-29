import { detectContactChannel, subscribeSchema } from "@/lib/validation";
import {
  createSubscriber,
  getSettingsForServer,
  hasAdminToken,
  isPromoCodeTaken,
} from "@/lib/directus-write";
import { createUniquePromoCode } from "@/lib/promo";
import { sendMaxNotification, sendMaxPhoneCode } from "@/lib/max";
import { sendAdminEmail, sendPromoEmail } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!rateLimit(`subscribe:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Некорректный запрос" }, { status: 400 });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Укажите корректный e-mail или телефон и согласие" }, { status: 400 });
  }
  const data = parsed.data;
  if (data.company) return Response.json({ ok: true }); // honeypot

  const channel = detectContactChannel(data.contact);
  const settings = await getSettingsForServer();
  const amount = settings.promo_amount ?? 5000;

  // Код: статический из настроек, либо уникальный (требует токена для записи).
  let code: string | null = null;
  if (settings.promo_static_code) {
    code = settings.promo_static_code;
  } else if (hasAdminToken()) {
    code = await createUniquePromoCode(settings.promo_code_prefix, isPromoCodeTaken);
  }

  // 1) запись подписчика — критично (промо-поля пишутся только при наличии токена)
  try {
    await createSubscriber({
      contact: data.contact,
      consent: data.consent,
      source_page: data.source_page || undefined,
      ...(code ? { promo_code: code, promo_channel: channel, promo_status: "issued", promo_sent_at: new Date().toISOString() } : {}),
    });
  } catch (e) {
    console.error("[subscribe] не удалось сохранить подписчика:", (e as Error).message);
    return Response.json({ ok: false, error: "Не удалось оформить подписку. Попробуйте позже." }, { status: 502 });
  }

  // 2) доставка кода подписчику + уведомление админа — best-effort
  const tasks: Promise<unknown>[] = [];
  if (code) {
    if (channel === "email") tasks.push(sendPromoEmail(data.contact, code, amount));
    else tasks.push(sendMaxPhoneCode(data.contact, `Ваш промокод на ${amount} ₽: ${code}`));
  }
  tasks.push(sendMaxNotification(`Новая подписка: ${data.contact}${code ? ` (промокод ${code})` : ""}`));
  tasks.push(sendAdminEmail("Новая подписка на сайте", `Контакт: ${data.contact}${code ? `\nПромокод: ${code}` : ""}`));
  await Promise.allSettled(tasks);

  return Response.json({ ok: true, code });
}
