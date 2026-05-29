import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SubcategoryChips } from "@/components/catalog/SubcategoryChips";
import type { Category } from "@/lib/directus.types";
import { getProducts, getSubcategories, getSubcategoryBySlug } from "@/lib/directus";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}): Promise<Metadata> {
  const { category, subcategory } = await params;
  const sub = await getSubcategoryBySlug(category, subcategory);
  if (!sub) return {};
  return { title: sub.name };
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}) {
  const { category, subcategory } = await params;
  const sub = await getSubcategoryBySlug(category, subcategory);
  if (!sub) notFound();

  const parent = typeof sub.category === "object" ? (sub.category as Category) : null;

  const [subcategories, products] = await Promise.all([
    getSubcategories(category),
    getProducts({ subcategorySlug: subcategory, limit: -1 }),
  ]);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/catalog" },
          { label: parent?.name ?? "Категория", href: `/catalog/${category}` },
          { label: sub.name },
        ]}
        title={sub.name}
      >
        <SubcategoryChips categorySlug={category} subcategories={subcategories} activeSlug={subcategory} />
      </PageHeader>

      <Container className="py-12">
        <p className="mb-6 text-sm text-muted">Найдено товаров: {products.length}</p>
        <ProductGrid products={products} />
      </Container>
    </>
  );
}
