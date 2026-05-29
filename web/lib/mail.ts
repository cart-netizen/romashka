import "server-only";
import nodemailer from "nodemailer";
import type { ChannelResult } from "./max";

const HOST = process.env.SMTP_HOST || "";
const PORT = Number(process.env.SMTP_PORT || 587);
const USER = process.env.SMTP_USER || "";
const PASS = process.env.SMTP_PASS || "";
const LEAD_TO = process.env.LEAD_EMAIL_TO || "";

function transport() {
  if (!HOST) return null;
  return nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465,
    auth: USER ? { user: USER, pass: PASS } : undefined,
  });
}

async function send(to: string, subject: string, text: string): Promise<ChannelResult> {
  const t = transport();
  if (!t || !to) {
    console.info(`[mail] пропущено (SMTP/получатель не заданы): ${subject}`);
    return { sent: false, skipped: "no-smtp" };
  }
  try {
    await t.sendMail({ from: USER || "no-reply@romashka.local", to, subject, text });
    return { sent: true };
  } catch (e) {
    console.error("[mail] ошибка отправки:", (e as Error).message);
    return { sent: false, error: (e as Error).message };
  }
}

/** Уведомление администратору о новой заявке. */
export function sendLeadEmail(subject: string, text: string): Promise<ChannelResult> {
  return send(LEAD_TO, subject, text);
}

/** Уведомление администратору о новой подписке. */
export function sendAdminEmail(subject: string, text: string): Promise<ChannelResult> {
  return send(LEAD_TO, subject, text);
}

/** Доставка промокода подписчику на e-mail. */
export function sendPromoEmail(to: string, code: string, amount: number): Promise<ChannelResult> {
  const text = `Спасибо за подписку!\n\nВаш промокод на скидку ${amount} ₽ на первый заказ: ${code}\n\nНазовите его при обращении в салон «Ромашка».`;
  return send(to, `Ваш промокод на ${amount} ₽ — салон «Ромашка»`, text);
}
