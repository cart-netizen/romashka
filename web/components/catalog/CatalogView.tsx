import { Container } from "@/components/ui/Container";
import type { Product } from "@/lib/directus.types";
import type { CatalogFacets } from "@/lib/directus";
import type { CatalogQuery } from "@/lib/catalog-params";
import { FilterSidebar } from "./FilterSidebar";
import { CatalogToolbar } from "./CatalogToolbar";
import { ProductGrid } from "./ProductGrid";
import { Pagination } from "./Pagination";

export function CatalogView({
  basePath,
  query,
  facets,
  items,
  total,
}: {
  basePath: string;
  query: CatalogQuery;
  facets: CatalogFacets;
  items: Product[];
  total: number;
}) {
  return (
    <Container className="py-10">
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <FilterSidebar basePath={basePath} query={query} facets={facets} />
        </aside>
        <div>
          <CatalogToolbar basePath={basePath} query={query} facets={facets} total={total} />
          <ProductGrid products={items} />
          <Pagination basePath={basePath} query={query} total={total} />
        </div>
      </div>
    </Container>
  );
}
