import { z } from "zod";

const phoneRegex = /^[+\d][\d\s()\-]{4,19}$/;

export const leadSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().regex(phoneRegex, "Укажите корректный телефон"),
  email: z.string().trim().email("Некорректный e-mail").optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z.boolean().refine((v) => v === true, "Необходимо согласие на обработку данных"),
  type: z.enum(["callback", "price_request", "contact"]).default("price_request"),
  product: z.number().int().positive().optional(),
  selected_size: z.string().trim().max(120).optional().or(z.literal("")),
  source_page: z.string().trim().max(300).optional().or(z.literal("")),
  // honeypot — должно быть пустым
  company: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const subscribeSchema = z.object({
  contact: z.string().trim().min(5, "Укажите e-mail или телефон").max(120),
  consent: z.boolean().refine((v) => v === true, "Необходимо согласие на обработку данных"),
  source_page: z.string().trim().max(300).optional().or(z.literal("")),
  company: z.string().optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

/** Определяет канал контакта: e-mail или телефон. */
export function detectContactChannel(contact: string): "email" | "max" {
  return contact.includes("@") ? "email" : "max";
}
