import { leadSchema } from "@/lib/validation";
import { createLead, type LeadRecord } from "@/lib/directus-write";
import { sendMaxNotification } from "@/lib/max";
import { sendLeadEmail } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const TYPE_LABELS: Record<string, string> = {
  callback: "Обратный звонок",
  price_request: "Узнать цену",
  contact: "Контактная форма",
};

export async function POST(req: Request) {
  if (!rateLimit(`lead:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Некорректный запрос" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Проверьте поля формы" }, { status: 400 });
  }
  const data = parsed.data;

  // honeypot: молча подтверждаем, не сохраняя
  if (data.company) return Response.json({ ok: true });

  const record: LeadRecord = {
    phone: data.phone,
    type: data.type,
    ...(data.name ? { name: data.name } : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(data.message ? { message: data.message } : {}),
    ...(data.product ? { product: data.product } : {}),
    ...(data.selected_size ? { selected_size: data.selected_size } : {}),
    ...(data.source_page ? { source_page: data.source_page } : {}),
  };

  // 1) запись в БД — критично
  try {
    await createLead(record);
  } catch (e) {
    console.error("[lead] не удалось сохранить заявку:", (e as Error).message);
    return Response.json({ ok: false, error: "Не удалось отправить заявку. Позвоните нам." }, { status: 502 });
  }

  // 2) каналы — best-effort, не влияют на результат
  const summary =
    `Новая заявка (${TYPE_LABELS[data.type] ?? data.type})\n` +
    `Имя: ${data.name || "—"}\nТелефон: ${data.phone}\n` +
    (data.email ? `E-mail: ${data.email}\n` : "") +
    (data.selected_size ? `Размер: ${data.selected_size}\n` : "") +
    (data.message ? `Сообщение: ${data.message}\n` : "") +
    (data.source_page ? `Страница: ${data.source_page}` : "");

  await Promise.allSettled([sendMaxNotification(summary), sendLeadEmail("Новая заявка с сайта", summary)]);

  return Response.json({ ok: true });
}
