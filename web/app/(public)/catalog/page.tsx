import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogView } from "@/components/catalog/CatalogView";
import { getCatalog, getCatalogFacets } from "@/lib/directus";
import { parseCatalogParams, type RawParams } from "@/lib/catalog-params";

export const metadata: Metadata = {
  title: "Каталог",
  description: "Премиальные диваны, кровати, кресла и тумбочки от фабрик-партнёров. Цена «от ___ ₽».",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const query = parseCatalogParams(await searchParams);
  const [{ items, total }, facets] = await Promise.all([getCatalog(query), getCatalogFacets()]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Главная", href: "/" }, { label: "Каталог" }]}
        title={query.q ? `Поиск: «${query.q}»` : "Каталог"}
        description="Премиальная мебель от фабрик-партнёров. Точную стоимость уточняйте через обращение."
      />
      <CatalogView basePath="/catalog" query={query} facets={facets} items={items} total={total} />
    </>
  );
}
