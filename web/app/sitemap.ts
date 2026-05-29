import type { MetadataRoute } from "next";
import { getAllProductSlugs, getFactories, getNavigationCategories } from "@/lib/directus";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, productSlugs, factories] = await Promise.all([
    getNavigationCategories(),
    getAllProductSlugs(),
    getFactories(),
  ]);

  const staticPaths = ["", "/catalog", "/factories", "/about", "/contacts", "/delivery", "/privacy"];

  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  for (const c of categories) {
    entries.push({ url: `${SITE_URL}/catalog/${c.slug}`, changeFrequency: "weekly", priority: 0.8 });
    for (const s of c.subcategories ?? []) {
      entries.push({ url: `${SITE_URL}/catalog/${c.slug}/${s.slug}`, changeFrequency: "weekly", priority: 0.6 });
    }
  }
  for (const slug of productSlugs) {
    entries.push({ url: `${SITE_URL}/product/${slug}`, changeFrequency: "weekly", priority: 0.6 });
  }
  for (const f of factories) {
    entries.push({ url: `${SITE_URL}/factories/${f.slug}`, changeFrequency: "monthly", priority: 0.5 });
  }

  return entries;
}
