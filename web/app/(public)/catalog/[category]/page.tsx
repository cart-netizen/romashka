import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SubcategoryChips } from "@/components/catalog/SubcategoryChips";
import { getCategories, getCategoryBySlug, getProducts, getSubcategories } from "@/lib/directus";

export const revalidate = 120;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) return {};
  return { title: cat.name, description: cat.description ?? `Каталог: ${cat.name}.` };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();

  const [subcategories, products] = await Promise.all([
    getSubcategories(category),
    getProducts({ categorySlug: category, limit: -1 }),
  ]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Главная", href: "/" }, { label: "Каталог", href: "/catalog" }, { label: cat.name }]}
        title={cat.name}
        description={cat.description}
      >
        <SubcategoryChips categorySlug={category} subcategories={subcategories} />
      </PageHeader>

      <Container className="py-12">
        <p className="mb-6 text-sm text-muted">Найдено товаров: {products.length}</p>
        <ProductGrid products={products} />
      </Container>
    </>
  );
}
