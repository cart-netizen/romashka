import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubcategoryChips } from "@/components/catalog/SubcategoryChips";
import { CatalogView } from "@/components/catalog/CatalogView";
import type { Category } from "@/lib/directus.types";
import { getCatalog, getCatalogFacets, getSubcategories, getSubcategoryBySlug } from "@/lib/directus";
import { parseCatalogParams, type RawParams } from "@/lib/catalog-params";

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
  searchParams,
}: {
  params: Promise<{ category: string; subcategory: string }>;
  searchParams: Promise<RawParams>;
}) {
  const { category, subcategory } = await params;
  const sub = await getSubcategoryBySlug(category, subcategory);
  if (!sub) notFound();

  const parent = typeof sub.category === "object" ? (sub.category as Category) : null;
  const uiQuery = parseCatalogParams(await searchParams);
  const dataQuery = { ...uiQuery, category, subcategory };

  const [{ items, total }, facets, subcategories] = await Promise.all([
    getCatalog(dataQuery),
    getCatalogFacets(category),
    getSubcategories(category),
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
      <CatalogView
        basePath={`/catalog/${category}/${subcategory}`}
        query={uiQuery}
        facets={facets}
        items={items}
        total={total}
      />
    </>
  );
}
