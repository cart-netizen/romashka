"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ConsentCheckbox } from "@/components/ui/ConsentCheckbox";
import { CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function CouponWidget({ image, promoAmount }: { image: string | null; promoAmount: number | null }) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const amount = new Intl.NumberFormat("ru-RU").format(promoAmount ?? 5000);

  return (
    <>
      {/* Вкладка у левого края */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Купон на скидку"
        className={cn(
          "fixed left-0 top-1/2 z-40 -translate-y-1/2 origin-left rotate-180 bg-terracotta px-3 py-2 text-sm text-cream shadow-[var(--shadow-soft)] [writing-mode:vertical-rl] hover:bg-cta print:hidden",
          open && "pointer-events-none opacity-0",
        )}
      >
        Купон на скидку
      </button>

      {open && <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />}

      {/* Выезжающая панель */}
      <div
        className={cn(
          "fixed bottom-0 right-0 z-50 w-full max-w-xl transition-transform duration-300 sm:bottom-5 sm:right-5 print:hidden",
          open ? "translate-y-0" : "pointer-events-none translate-y-[120%]",
        )}
        role="dialog"
        aria-label="Подписка на скидки"
        aria-hidden={!open}
      >
        <div className="flex overflow-hidden rounded-t-lg bg-surface shadow-[var(--shadow-soft)] sm:rounded-lg">
          {image && (
            <div className="relative hidden w-2/5 shrink-0 sm:block">
              <Image src={image} alt="" fill sizes="240px" className="object-cover" />
            </div>
          )}
          <div className="relative flex-1 p-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Закрыть"
              className="absolute right-3 top-3 text-muted hover:text-ink"
            >
              <CloseIcon />
            </button>

            <h3 className="pr-6 text-xl">Присоединяйтесь к нам</h3>
            <p className="mt-2 text-sm text-muted">
              Узнавайте об эксклюзивных предложениях первыми. А ещё получите купон на{" "}
              <span className="text-ink">{amount} ₽</span> на первый заказ.
            </p>

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setNotice("Спасибо! Отправка подписки и выдача промокода подключаются на следующем этапе.");
              }}
            >
              <input
                type="text"
                name="contact"
                required
                placeholder="E-mail или телефон"
                className="w-full rounded-[var(--radius-card)] border border-line bg-cream px-4 py-2.5 text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none"
              />
              <ConsentCheckbox />
              {notice && (
                <p className="rounded-[var(--radius-card)] border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-xs text-ink">
                  {notice}
                </p>
              )}
              <Button type="submit" fullWidth>
                Подписаться
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
