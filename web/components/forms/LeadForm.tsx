"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { ConsentCheckbox } from "@/components/ui/ConsentCheckbox";
import { leadSchema } from "@/lib/validation";

type LeadType = "callback" | "price_request" | "contact";
type Status = "idle" | "submitting" | "success" | "error";

export function LeadForm({
  type,
  product,
  selectedSize,
  onSuccess,
}: {
  type: LeadType;
  product?: number;
  selectedSize?: string;
  onSuccess?: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  if (status === "success") {
    return (
      <div className="rounded-[var(--radius-card)] border border-terracotta/30 bg-terracotta/10 p-5 text-center">
        <p className="font-serif text-lg text-ink">Спасибо! Заявка отправлена.</p>
        <p className="mt-1 text-sm text-muted">Менеджер свяжется с вами в ближайшее время.</p>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      message: String(fd.get("message") || ""),
      consent: fd.get("consent") === "on",
      type,
      ...(product ? { product } : {}),
      ...(selectedSize ? { selected_size: selectedSize } : {}),
      source_page: typeof window !== "undefined" ? window.location.pathname : "",
      company: String(fd.get("company") || ""),
    };

    const parsed = leadSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Проверьте поля формы");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Ошибка отправки");
      setStatus("success");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {selectedSize && <p className="text-sm text-muted">Выбранный размер: {selectedSize}</p>}

      <div>
        <Label htmlFor="lf-name">Имя</Label>
        <Input id="lf-name" name="name" autoComplete="name" placeholder="Как к вам обращаться" />
      </div>
      <div>
        <Label htmlFor="lf-phone">Телефон *</Label>
        <Input id="lf-phone" name="phone" type="tel" required autoComplete="tel" placeholder="+7 ___ ___-__-__" />
      </div>
      <div>
        <Label htmlFor="lf-email">E-mail</Label>
        <Input id="lf-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
      </div>
      {type !== "callback" && (
        <div>
          <Label htmlFor="lf-message">Сообщение</Label>
          <Textarea id="lf-message" name="message" placeholder="Комментарий или вопрос" />
        </div>
      )}

      {/* honeypot */}
      <div className="hidden" aria-hidden="true">
        <input name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <ConsentCheckbox />

      {error && <p className="text-sm text-cta">{error}</p>}

      <Button type="submit" fullWidth size="lg" disabled={status === "submitting"}>
        {status === "submitting" ? "Отправка…" : type === "callback" ? "Заказать звонок" : "Отправить заявку"}
      </Button>
    </form>
  );
}
