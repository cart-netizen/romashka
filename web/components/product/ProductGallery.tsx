"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { Lightbox } from "./Lightbox";
import { useSizeVariant } from "./SizeVariantContext";

export function ProductGallery({
  images,
  fullImages,
  alt,
}: {
  images: string[];
  fullImages?: string[];
  alt: string;
}) {
  // Заглавное фото размера-варианта (если есть) — первым в галерее, остальные общие.
  const variant = useSizeVariant();
  const lead = variant ? variant.variants[variant.index] : null;
  const variantIndex = variant?.index ?? -1;

  const display = lead?.image ? [lead.image, ...images] : images;
  const baseFull = fullImages ?? images;
  const displayFull = lead?.imageFull ? [lead.imageFull, ...baseFull] : baseFull;

  const [active, setActive] = useState(0);
  // При смене размера показываем заглавное фото варианта (корректировка стейта при смене пропа).
  const [prevVariant, setPrevVariant] = useState(variantIndex);
  if (variantIndex !== prevVariant) {
    setPrevVariant(variantIndex);
    setActive(0);
  }

  const [zoom, setZoom] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const n = display.length;
  const safe = Math.min(active, Math.max(0, n - 1));
  const main = display[safe];

  return (
    <div className="flex gap-4">
      {n > 1 && (
        <div className="flex w-20 shrink-0 flex-col items-center gap-2">
          <div ref={thumbsRef} className="scrollbar-thin flex max-h-[520px] w-full flex-col gap-3 overflow-y-auto">
            {display.map((img, i) => (
              <button
                key={img + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Фото ${i + 1}`}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-[var(--radius-card)] border bg-surface",
                  i === safe ? "border-ink" : "border-line hover:border-ink/40",
                )}
              >
                <Image src={img} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
          {n > 4 && (
            <button
              type="button"
              aria-label="Прокрутить миниатюры"
              onClick={() => thumbsRef.current?.scrollBy({ top: 200, behavior: "smooth" })}
              className="text-muted transition-colors hover:text-ink"
            >
              <ChevronDownIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {main ? (
        <button
          type="button"
          aria-label="Открыть фото на весь экран"
          onClick={() => setZoom(true)}
          className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-[var(--radius-card)] bg-surface"
        >
          <Image src={main} alt={alt} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        </button>
      ) : (
        <div className="relative flex aspect-square flex-1 items-center justify-center rounded-[var(--radius-card)] bg-surface text-muted">
          нет фото
        </div>
      )}

      {zoom && (
        <Lightbox
          images={displayFull}
          index={safe}
          onClose={() => setZoom(false)}
          onPrev={() => setActive((i) => (i - 1 + n) % n)}
          onNext={() => setActive((i) => (i + 1) % n)}
        />
      )}
    </div>
  );
}
