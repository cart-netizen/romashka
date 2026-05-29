"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { NavCategory } from "./nav.types";

const SECONDARY_LINKS = [
  { href: "/catalog", label: "Весь каталог" },
  { href: "/factories", label: "Фабрики" },
  { href: "/about", label: "О компании" },
  { href: "/delivery", label: "Доставка и условия" },
  { href: "/contacts", label: "Контакты" },
  { href: "/favorites", label: "Избранное" },
  { href: "/cabinet/login", label: "Кабинет дизайнера" },
];

export function MobileMenu({
  nav,
  open,
  onClose,
}: {
  nav: NavCategory[];
  open: boolean;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className={cn("fixed inset-0 z-[60] lg:hidden", open ? "" : "pointer-events-none")} aria-hidden={!open}>
      <div
        className={cn("absolute inset-0 bg-ink/50 transition-opacity", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-cream shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="font-serif text-xl font-semibold uppercase tracking-[0.18em]">Ромашка</span>
          <button type="button" aria-label="Закрыть меню" onClick={onClose} className="text-ink">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-1">
            {nav.map((cat) => (
              <li key={cat.id} className="border-b border-line/60">
                <div className="flex items-center justify-between">
                  <Link href={`/catalog/${cat.slug}`} onClick={onClose} className="py-3 text-base">
                    {cat.name}
                  </Link>
                  {cat.subcategories.length > 0 && (
                    <button
                      type="button"
                      aria-label={`Раскрыть ${cat.name}`}
                      onClick={() => setExpanded((id) => (id === cat.id ? null : cat.id))}
                      className="p-2 text-muted"
                    >
                      <ChevronDownIcon
                        className={cn("h-5 w-5 transition-transform", expanded === cat.id && "rotate-180")}
                      />
                    </button>
                  )}
                </div>
                {expanded === cat.id && (
                  <ul className="space-y-1 pb-3 pl-3">
                    <li>
                      <Link
                        href={`/catalog/${cat.slug}`}
                        onClick={onClose}
                        className="block py-1.5 text-sm text-muted hover:text-terracotta"
                      >
                        Все {cat.name.toLowerCase()}
                      </Link>
                    </li>
                    {cat.subcategories.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/catalog/${cat.slug}/${sub.slug}`}
                          onClick={onClose}
                          className="block py-1.5 text-sm text-muted hover:text-terracotta"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <ul className="mt-6 space-y-1">
            {SECONDARY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={onClose} className="block py-2 text-sm text-ink/80 hover:text-terracotta">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
