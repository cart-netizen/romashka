"use client";

import { useState } from "react";
import Image from "next/image";
import { useSizeVariant } from "./SizeVariantContext";
import { Lightbox } from "./Lightbox";

/** Чертёж «Фактические размеры» — меняется при выборе размера-варианта.
 *  Клик по чертежу открывает его на весь экран (общий лайтбокс, портал в body). */
export function VariantDimensions({
  baseImages,
  disclaimer,
}: {
  baseImages: string[];
  disclaimer: string | null;
}) {
  const ctx = useSizeVariant();
  const variantDim = ctx?.variants[ctx.index]?.dimImage;
  const images = variantDim ? [variantDim] : baseImages;
  const [zoom, setZoom] = useState<number | null>(null);
  const n = images.length;

  return (
    <div>
      {n > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((u, i) => (
            <button
              key={u + i}
              type="button"
              onClick={() => setZoom(i)}
              aria-label="Открыть чертёж на весь экран"
              className="relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-[var(--radius-card)] bg-surface"
            >
              <Image src={u} alt={`Чертёж ${i + 1}`} fill sizes="(max-width: 640px) 100vw, 400px" className="object-contain" />
            </button>
          ))}
        </div>
      )}
      {disclaimer && <p className="mt-4 text-xs text-muted">{disclaimer}</p>}

      {zoom !== null && (
        <Lightbox
          images={images}
          index={zoom}
          onClose={() => setZoom(null)}
          onPrev={() => setZoom((z) => ((z ?? 0) - 1 + n) % n)}
          onNext={() => setZoom((z) => ((z ?? 0) + 1) % n)}
        />
      )}
    </div>
  );
}
