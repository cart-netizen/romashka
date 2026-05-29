"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const main = images[active];

  return (
    <div className="flex gap-4">
      {images.length > 1 && (
        <div className="scrollbar-thin flex max-h-[560px] w-20 shrink-0 flex-col gap-3 overflow-y-auto">
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Фото ${i + 1}`}
              className={cn(
                "relative aspect-square overflow-hidden rounded-[var(--radius-card)] border bg-surface",
                i === active ? "border-ink" : "border-line hover:border-ink/40",
              )}
            >
              <Image src={img} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative aspect-square flex-1 overflow-hidden rounded-[var(--radius-card)] bg-surface">
        {main ? (
          <Image src={main} alt={alt} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">нет фото</div>
        )}
      </div>
    </div>
  );
}
