"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PhoneIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export interface PanelSize {
  label: string;
}

export function ProductPurchasePanel({
  productName,
  sizes,
  leadTimeNote,
  phone,
  messengerLink,
}: {
  productName: string;
  sizes: string[];
  leadTimeNote: string | null;
  phone: string | null;
  messengerLink: string | null;
}) {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const selectedSize = sizes[selected];

  return (
    <div className="space-y-5">
      {sizes.length > 0 && (
        <div>
          <span className="text-sm text-ink">Размер:</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s, i) => (
              <button
                key={s + i}
                type="button"
                onClick={() => setSelected(i)}
                className={cn(
                  "rounded-[var(--radius-card)] border px-4 py-2 text-sm transition-colors",
                  i === selected ? "border-ink bg-ink text-cream" : "border-line text-ink hover:border-ink",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button size="lg" fullWidth onClick={() => setOpen(true)}>
        Узнать цену
      </Button>

      {leadTimeNote && <p className="text-sm text-muted">{leadTimeNote}</p>}

      <Modal open={open} onClose={() => setOpen(false)} title="Узнать цену">
        <p className="text-sm text-muted">
          {productName}
          {selectedSize ? ` · ${selectedSize}` : ""}
        </p>
        <p className="mt-4 text-sm text-ink/90">
          Свяжитесь с салоном — менеджер назовёт актуальную стоимость, поможет с выбором обивки и размера.
        </p>
        <div className="mt-6 space-y-3">
          {phone && (
            <ButtonLink href={`tel:${phone.replace(/[^+\d]/g, "")}`} fullWidth size="lg">
              <PhoneIcon className="h-5 w-5" /> Позвонить {phone}
            </ButtonLink>
          )}
          {messengerLink && (
            <ButtonLink href={messengerLink} variant="burgundy" fullWidth size="lg" target="_blank" rel="noopener noreferrer">
              Написать в MAX
            </ButtonLink>
          )}
          <ButtonLink href="/contacts" variant="outline" fullWidth size="lg">
            Контакты и адрес салона
          </ButtonLink>
        </div>
        <p className="mt-4 text-xs text-muted">
          Онлайн-заявка с формой появится здесь же. Пока — свяжитесь удобным способом или загляните в{" "}
          <Link href="/contacts" className="underline underline-offset-2">
            салон
          </Link>
          .
        </p>
      </Modal>
    </div>
  );
}
