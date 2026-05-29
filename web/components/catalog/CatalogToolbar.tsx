"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/ui/icons";
import type { CatalogFacets } from "@/lib/directus";
import { buildCatalogParams, type CatalogQuery, type SortKey, SORT_OPTIONS } from "@/lib/catalog-params";
import { plural } from "@/lib/format";
import { MobileFilterPanel } from "./MobileFilterPanel";

export function CatalogToolbar({
  basePath,
  query,
  facets,
  total,
}: {
  basePath: string;
  query: CatalogQuery;
  facets: CatalogFacets;
  total: number;
}) {
  const router = useRouter();
  const [q, setQ] = useState(query.q ?? "");

  const push = (patch: Partial<CatalogQuery>) => {
    const params = buildCatalogParams({ ...query, page: 1, ...patch });
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Найдено: {total} {plural(total, ["товар", "товара", "товаров"])}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <MobileFilterPanel basePath={basePath} query={query} facets={facets} />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            push({ q: q.trim() || undefined });
          }}
          className="relative"
        >
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по каталогу"
            className="h-10 w-44 rounded-[var(--radius-card)] border border-line bg-cream pl-9 pr-3 text-sm focus:border-ink focus:outline-none sm:w-56"
          />
        </form>

        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="hidden sm:inline">Сортировка:</span>
          <select
            value={query.sort}
            onChange={(e) => push({ sort: e.target.value as SortKey })}
            className="h-10 rounded-[var(--radius-card)] border border-line bg-cream px-3 text-sm text-ink focus:border-ink focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
