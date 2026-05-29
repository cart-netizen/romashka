import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { getCategories, getProducts } from "@/lib/directus";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Каталог",
  description: "Премиальные диваны, кровати, кресла и тумбочки от фабрик-партнёров. Цена «от ___ ₽».",
};

export default async function CatalogPage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts({ limit: -1 })]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Главная", href: "/" }, { label: "Каталог" }]}
        title="Каталог"
        description="Премиальная мебель от фабрик-партнёров. Точную стоимость уточняйте через обращение."
      >
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/catalog/${c.slug}`}
              className="rounded-full border border-line bg-cream px-4 py-1.5 text-sm text-ink/80 transition-colors hover:border-terracotta hover:text-terracotta"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </PageHeader>

      <Container className="py-12">
        <p className="mb-6 text-sm text-muted">Найдено товаров: {products.length}</p>
        <ProductGrid products={products} />
      </Container>
    </>
  );
}
