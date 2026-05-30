"use client";

import { useState } from "react";
import { ChevronDownIcon } from "./icons";
import { cn } from "@/lib/cn";

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(items.map((it, i) => [i, !!it.defaultOpen])),
  );

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const isOpen = !!open[i];
        return (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
            >
              <span className="font-serif text-lg text-ink">{item.title}</span>
              <ChevronDownIcon
                className={cn("h-5 w-5 shrink-0 text-muted transition-transform duration-300", isOpen && "rotate-180")}
              />
            </button>
            {/* Плавная анимация высоты через grid-template-rows 0fr → 1fr */}
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div
                className={cn(
                  "min-h-0 overflow-hidden transition-opacity duration-300",
                  isOpen ? "opacity-100" : "opacity-0",
                )}
              >
                <div className="pb-6 text-sm leading-relaxed text-ink/90">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
