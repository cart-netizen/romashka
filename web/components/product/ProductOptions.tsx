"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LeadFormModal } from "@/components/forms/LeadFormModal";
import { cn } from "@/lib/cn";
import { FabricSwatches, type Swatch } from "./FabricSwatches";
import { UspBanner } from "./UspBanner";

export function ProductOptions({
  productId,
  productName,
  sizes,
  materials,
  swatches,
  uspMessages,
  leadTimeNote,
  messengerLink,
}: {
  productId: number;
  productName: string;
  sizes: string[];
  materials: string;
  swatches: Swatch[];
  uspMessages: string[];
  leadTimeNote: string | null;
  messengerLink: string | null;
}) {
  const [selected, setSelected] = useState(0);
  const [modal, setModal] = useState<null | "price_request" | "callback">(null);
  const selectedSize = sizes[selected];

  return (
    <div className="space-y-6">
      {sizes.length > 0 && (
        <div>
          <span className="font-serif text-base text-ink">Размер:</span>
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

      {materials && (
        <p className="font-serif text-base text-ink">
          Материалы: <span className="font-sans text-muted">{materials}</span>
        </p>
      )}

      {swatches.length > 0 && (
        <div>
          <p className="mb-2 font-serif text-base text-ink">Цвет обивки под заказ:</p>
          <FabricSwatches swatches={swatches} />
        </div>
      )}

      {uspMessages.length > 0 && <UspBanner messages={uspMessages} />}

      <div className="space-y-3">
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
      </div>

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
