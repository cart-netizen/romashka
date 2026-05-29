"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const main = images[active];

  return (
    <div className="flex gap-4">
      {images.length > 1 && (
        <div className="flex w-20 shrink-0 flex-col items-center gap-2">
          <div ref={thumbsRef} className="scrollbar-thin flex max-h-[520px] w-full flex-col gap-3 overflow-y-auto">
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
          {images.length > 4 && (
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
