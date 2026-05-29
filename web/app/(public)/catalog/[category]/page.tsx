import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubcategoryChips } from "@/components/catalog/SubcategoryChips";
import { CatalogView } from "@/components/catalog/CatalogView";
import { getCatalog, getCategories, getCategoryBySlug, getCatalogFacets, getSubcategories } from "@/lib/directus";
import { parseCatalogParams, type RawParams } from "@/lib/catalog-params";

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

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<RawParams>;
}) {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();

  const uiQuery = parseCatalogParams(await searchParams);
  const dataQuery = { ...uiQuery, category };

  const [{ items, total }, facets, subcategories] = await Promise.all([
    getCatalog(dataQuery),
    getCatalogFacets(category),
    getSubcategories(category),
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
      <CatalogView basePath={`/catalog/${category}`} query={uiQuery} facets={facets} items={items} total={total} />
    </>
  );
}
