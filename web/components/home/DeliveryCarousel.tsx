"use client";

import { useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";

/** Карусель абзацев о доставке — перелистывание стрелками. */
export function DeliveryCarousel({ items }: { items: string[] }) {
  const [index, setIndex] = useState(0);
  const n = items.length;
  if (n === 0) return null;
  const go = (d: number) => setIndex((i) => (i + d + n) % n);

  return (
    <div className="flex h-full flex-col">
      <p className="min-h-[7rem] text-base leading-relaxed text-muted">{items[index]}</p>
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Предыдущий"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-terracotta hover:text-terracotta"
        >
          <ChevronRightIcon className="h-5 w-5 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Следующий"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-terracotta hover:text-terracotta"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
        <span className="ml-2 text-sm text-muted">
          {index + 1} / {n}
        </span>
      </div>
    </div>
  );
}
