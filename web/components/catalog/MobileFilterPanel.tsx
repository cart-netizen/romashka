"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { CatalogFacets } from "@/lib/directus";
import { countActiveFilters, type CatalogQuery } from "@/lib/catalog-params";
import { FilterSidebar } from "./FilterSidebar";

export function MobileFilterPanel({
  basePath,
  query,
  facets,
}: {
  basePath: string;
  query: CatalogQuery;
  facets: CatalogFacets;
}) {
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(query);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-[var(--radius-card)] border border-line bg-cream px-4 py-2 text-sm text-ink"
      >
        Фильтры
        {active > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1.5 text-xs text-cream">
            {active}
          </span>
        )}
      </button>

      <div className={cn("fixed inset-0 z-[70]", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <div
          className={cn("absolute inset-0 bg-ink/50 transition-opacity", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-cream shadow-xl transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="font-serif text-xl">Фильтры</span>
            <button type="button" aria-label="Закрыть" onClick={() => setOpen(false)} className="text-ink">
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5">
            <FilterSidebar basePath={basePath} query={query} facets={facets} onApplied={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
}
