import Link from "next/link";
import { cn } from "@/lib/cn";
import { buildCatalogParams, type CatalogQuery, PAGE_SIZE } from "@/lib/catalog-params";

export function Pagination({
  basePath,
  query,
  total,
}: {
  basePath: string;
  query: CatalogQuery;
  total: number;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const href = (page: number) => {
    const params = buildCatalogParams({ ...query, page });
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const current = Math.min(query.page, totalPages);

  return (
    <nav aria-label="Постраничная навигация" className="mt-12 flex items-center justify-center gap-1.5">
      {current > 1 && (
        <Link href={href(current - 1)} className="rounded-[var(--radius-card)] border border-line px-3 py-2 text-sm hover:border-ink">
          Назад
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === current ? "page" : undefined}
          className={cn(
            "min-w-10 rounded-[var(--radius-card)] border px-3 py-2 text-center text-sm",
            p === current ? "border-burgundy bg-burgundy text-cream" : "border-line hover:border-ink",
          )}
        >
          {p}
        </Link>
      ))}
      {current < totalPages && (
        <Link href={href(current + 1)} className="rounded-[var(--radius-card)] border border-line px-3 py-2 text-sm hover:border-ink">
          Вперёд
        </Link>
      )}
    </nav>
  );
}
