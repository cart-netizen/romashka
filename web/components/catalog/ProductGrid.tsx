import type { Product } from "@/lib/directus.types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-line py-16 text-center text-muted">
        В этом разделе пока нет товаров.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
