"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LeadFormModal } from "@/components/forms/LeadFormModal";
import { cn } from "@/lib/cn";

export function ProductPurchasePanel({
  productId,
  productName,
  sizes,
  leadTimeNote,
  messengerLink,
}: {
  productId: number;
  productName: string;
  sizes: string[];
  leadTimeNote: string | null;
  messengerLink: string | null;
}) {
  const [selected, setSelected] = useState(0);
  const [modal, setModal] = useState<null | "price_request" | "callback">(null);
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

      <Button size="lg" fullWidth onClick={() => setModal("price_request")}>
        Узнать цену
      </Button>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="md" className="flex-1" onClick={() => setModal("callback")}>
          Заказать звонок
        </Button>
        {messengerLink && (
          <ButtonLink href={messengerLink} variant="burgundy" size="md" className="flex-1" target="_blank" rel="noopener noreferrer">
            Написать в MAX
          </ButtonLink>
        )}
      </div>

      {leadTimeNote && <p className="text-sm text-muted">{leadTimeNote}</p>}

      <LeadFormModal
        open={modal !== null}
        onClose={() => setModal(null)}
        type={modal ?? "price_request"}
        product={productId}
        productName={productName}
        selectedSize={modal === "price_request" ? selectedSize : undefined}
      />
    </div>
  );
}
