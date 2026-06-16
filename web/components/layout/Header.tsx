import { assetUrl, getMenuPromos, getNavigationCategories } from "@/lib/directus";
import type { NavCategory } from "./nav.types";
import { Navbar } from "./Navbar";

/** Серверный Header: тянет навигацию из Directus и отдаёт клиентскому Navbar. */
export async function Header() {
  const [categories, promos] = await Promise.all([getNavigationCategories(), getMenuPromos()]);

  const nav: NavCategory[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    subcategories: (c.subcategories ?? []).map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
    promos: promos
      .filter((p) => p.category === c.id)
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        title: p.title,
        // приоритет: явная ссылка → авто-ссылка по бейджу → страница категории
        link: p.link || (p.badge ? `/catalog/${c.slug}?badge=${p.badge}` : `/catalog/${c.slug}`),
        image: assetUrl(p.image, { width: 480, height: 320, fit: "cover" }),
      })),
  }));

  return <Navbar nav={nav} />;
}
