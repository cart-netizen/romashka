import type { Product } from "@/lib/directus.types";
import { ProductCard } from "@/components/catalog/ProductCard";

/** «Рекомендуем также» — горизонтальный скролл с плитками фиксированной ширины. */
export function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <div className="scrollbar-thin -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
      {products.map((p) => (
        <div key={p.id} className="w-52 shrink-0 snap-start sm:w-60">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
