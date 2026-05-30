"use client";

import Image from "next/image";
import { useSizeVariant } from "./SizeVariantContext";

/** Чертёж «Фактические размеры» — меняется при выборе размера-варианта. */
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

  return (
    <div>
      {images.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((u, i) => (
            <div key={u + i} className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-surface">
              <Image src={u} alt={`Чертёж ${i + 1}`} fill sizes="(max-width: 640px) 100vw, 400px" className="object-contain" />
            </div>
          ))}
        </div>
      )}
      {disclaimer && <p className="mt-4 text-xs text-muted">{disclaimer}</p>}
    </div>
  );
}
