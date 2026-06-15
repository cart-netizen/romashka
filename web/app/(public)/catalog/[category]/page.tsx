import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SubcategoryChips } from "@/components/catalog/SubcategoryChips";
import { CatalogView } from "@/components/catalog/CatalogView";
import { assetUrl, getCatalog, getCategoryBySlug, getCatalogFacets, getSubcategories } from "@/lib/directus";
import { parseCatalogParams, type RawParams } from "@/lib/catalog-params";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";

// Каталог категории фильтруется через searchParams — рендерим динамически
// (generateStaticParams + searchParams в Next 16 даёт DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) return {};
  const og = assetUrl(cat.hero_image, { width: 1200, height: 630, fit: "cover" });
  const description = cat.description ?? `Каталог: ${cat.name}.`;
  return {
    title: cat.name,
    description,
    alternates: { canonical: `/catalog/${category}` },
    openGraph: { title: cat.name, description, url: `/catalog/${category}`, ...(og ? { images: [og] } : {}) },
  };
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
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Главная", url: "/" },
          { name: "Каталог", url: "/catalog" },
          { name: cat.name, url: `/catalog/${category}` },
        ])}
      />
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
