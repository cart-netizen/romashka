import "server-only";
import type {
  Category,
  Factory,
  MenuPromo,
  Product,
  Review,
  SiteSettings,
  Subcategory,
} from "./directus.types";

const DIRECTUS_URL = (process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/$/, "");
// Базовый URL для ассетов в браузере (next/image оптимизатор тоже использует его).
const ASSET_BASE = (
  process.env.NEXT_PUBLIC_DIRECTUS_URL ??
  process.env.DIRECTUS_URL ??
  "http://localhost:8055"
).replace(/\/$/, "");

const DEFAULT_REVALIDATE = 120;

type QueryValue = string | number | boolean | object | undefined;

function buildQuery(params: Record<string, QueryValue>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    sp.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

interface FetchOpts {
  revalidate?: number;
  tags?: string[];
}

async function dGet<T>(
  collectionPath: string,
  params: Record<string, QueryValue> = {},
  opts: FetchOpts = {},
): Promise<T> {
  const url = `${DIRECTUS_URL}${collectionPath}${buildQuery(params)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: opts.revalidate ?? DEFAULT_REVALIDATE, tags: opts.tags },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Directus ${collectionPath} → ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.data as T;
}

/** URL ассета Directus с трансформациями. Безопасно для серверных и клиентских компонентов. */
export function assetUrl(
  id: string | null | undefined,
  opts: { width?: number; height?: number; quality?: number; fit?: "cover" | "contain" | "inside" } = {},
): string | null {
  if (!id) return null;
  const sp = new URLSearchParams();
  if (opts.width) sp.set("width", String(opts.width));
  if (opts.height) sp.set("height", String(opts.height));
  if (opts.quality) sp.set("quality", String(opts.quality));
  if (opts.fit) sp.set("fit", opts.fit);
  const q = sp.toString();
  return `${ASSET_BASE}/assets/${id}${q ? `?${q}` : ""}`;
}

const PUBLISHED = { status: { _eq: "published" } };

const PRODUCT_CARD_FIELDS = [
  "id",
  "name",
  "slug",
  "sku",
  "price_from",
  "short_description",
  "main_image",
  "variants_count",
  "is_bestseller",
  "is_new",
  "is_sale",
  "in_stock",
  "factory.name",
  "factory.slug",
  "colors.colors_id.id",
  "colors.colors_id.name",
  "colors.colors_id.hex",
].join(",");

const PRODUCT_DETAIL_FIELDS = [
  "*",
  "main_image",
  "gallery.directus_files_id",
  "dimensions_images.directus_files_id",
  "colors.colors_id.id",
  "colors.colors_id.name",
  "colors.colors_id.hex",
  "category.id",
  "category.name",
  "category.slug",
  "subcategory.id",
  "subcategory.name",
  "subcategory.slug",
  "factory.id",
  "factory.name",
  "factory.slug",
].join(",");

// ── Навигация / настройки ─────────────────────────────────────────────────

export async function getSiteSettings(): Promise<SiteSettings> {
  return dGet<SiteSettings>("/items/site_settings", { fields: "*" }, { tags: ["site_settings"] });
}

/** Категории с подкатегориями — для шапки и mega-menu (две выборки + группировка). */
export async function getNavigationCategories(): Promise<Category[]> {
  const [categories, subcategories] = await Promise.all([
    dGet<Category[]>(
      "/items/categories",
      { fields: "id,name,slug,sort", filter: PUBLISHED, sort: "sort", limit: -1 },
      { tags: ["categories"] },
    ),
    dGet<Subcategory[]>(
      "/items/subcategories",
      { fields: "id,name,slug,sort,category", filter: PUBLISHED, sort: "sort", limit: -1 },
      { tags: ["categories"] },
    ),
  ]);

  return categories.map((c) => ({
    ...c,
    subcategories: subcategories.filter((s) => s.category === c.id),
  }));
}

export async function getMenuPromos(): Promise<MenuPromo[]> {
  return dGet<MenuPromo[]>(
    "/items/menu_promos",
    {
      fields: "id,title,image,link,sort,category",
      filter: PUBLISHED,
      sort: "sort",
      limit: -1,
    },
    { tags: ["menu_promos"] },
  );
}

export async function getCategories(): Promise<Category[]> {
  return dGet<Category[]>(
    "/items/categories",
    { fields: "id,name,slug,description,hero_image,sort", filter: PUBLISHED, sort: "sort", limit: -1 },
    { tags: ["categories"] },
  );
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const rows = await dGet<Category[]>("/items/categories", {
    fields: "id,name,slug,description,hero_image",
    filter: { ...PUBLISHED, slug: { _eq: slug } },
    limit: 1,
  });
  return rows[0] ?? null;
}

export async function getSubcategories(categorySlug: string): Promise<Subcategory[]> {
  return dGet<Subcategory[]>(
    "/items/subcategories",
    {
      fields: "id,name,slug",
      filter: { ...PUBLISHED, category: { slug: { _eq: categorySlug } } },
      sort: "sort",
      limit: -1,
    },
    { tags: ["categories"] },
  );
}

export async function getSubcategoryBySlug(
  categorySlug: string,
  subcategorySlug: string,
): Promise<Subcategory | null> {
  const rows = await dGet<Subcategory[]>("/items/subcategories", {
    fields: "id,name,slug,category.id,category.name,category.slug",
    filter: {
      ...PUBLISHED,
      slug: { _eq: subcategorySlug },
      category: { slug: { _eq: categorySlug } },
    },
    limit: 1,
  });
  return rows[0] ?? null;
}

// ── Товары ────────────────────────────────────────────────────────────────

export interface ProductQuery {
  categorySlug?: string;
  subcategorySlug?: string;
  factorySlug?: string;
  isBestseller?: boolean;
  isNew?: boolean;
  isSale?: boolean;
  sort?: string;
  limit?: number;
  excludeId?: number;
}

export async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  const filter: Record<string, unknown> = { ...PUBLISHED };
  if (q.categorySlug) filter.category = { slug: { _eq: q.categorySlug } };
  if (q.subcategorySlug) filter.subcategory = { slug: { _eq: q.subcategorySlug } };
  if (q.factorySlug) filter.factory = { slug: { _eq: q.factorySlug } };
  if (q.isBestseller) filter.is_bestseller = { _eq: true };
  if (q.isNew) filter.is_new = { _eq: true };
  if (q.isSale) filter.is_sale = { _eq: true };
  if (q.excludeId) filter.id = { _neq: q.excludeId };

  return dGet<Product[]>(
    "/items/products",
    {
      fields: PRODUCT_CARD_FIELDS,
      filter,
      sort: q.sort ?? "sort",
      limit: q.limit ?? -1,
    },
    { tags: ["products"] },
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = await dGet<Product[]>(
    "/items/products",
    { fields: PRODUCT_DETAIL_FIELDS, filter: { ...PUBLISHED, slug: { _eq: slug } }, limit: 1 },
    { tags: ["products"] },
  );
  return rows[0] ?? null;
}

export async function getAllProductSlugs(): Promise<string[]> {
  const rows = await dGet<{ slug: string }[]>("/items/products", {
    fields: "slug",
    filter: PUBLISHED,
    limit: -1,
  });
  return rows.map((r) => r.slug);
}

export async function getRelatedProducts(product: Product, limit = 5): Promise<Product[]> {
  const categorySlug =
    product.category && typeof product.category === "object" ? product.category.slug : undefined;
  if (!categorySlug) return [];
  return getProducts({ categorySlug, excludeId: product.id, limit });
}

// ── Отзывы ──────────────────────────────────────────────────────────────────

export async function getReviews(productId: number): Promise<Review[]> {
  return dGet<Review[]>(
    "/items/reviews",
    {
      fields: "id,author_name,rating,text,created_at",
      filter: { ...PUBLISHED, product: { _eq: productId } },
      sort: "-created_at",
      limit: -1,
    },
    { tags: ["reviews"] },
  );
}

// ── USP-сообщения (ротация на карточке) ──────────────────────────────────────

export interface UspMessage {
  id: number;
  text: string;
  icon: string | null;
}

export async function getUspMessages(): Promise<UspMessage[]> {
  return dGet<UspMessage[]>(
    "/items/usp_messages",
    { fields: "id,text,icon", filter: PUBLISHED, sort: "sort", limit: -1 },
    { tags: ["usp_messages"] },
  );
}

// ── Фабрики ─────────────────────────────────────────────────────────────────

export async function getFactories(): Promise<Factory[]> {
  return dGet<Factory[]>(
    "/items/factories",
    { fields: "id,name,slug,logo,description,website,sort", filter: PUBLISHED, sort: "sort", limit: -1 },
    { tags: ["factories"] },
  );
}

export async function getFactoryBySlug(slug: string): Promise<Factory | null> {
  const rows = await dGet<Factory[]>("/items/factories", {
    fields: "id,name,slug,logo,description,website",
    filter: { ...PUBLISHED, slug: { _eq: slug } },
    limit: 1,
  });
  return rows[0] ?? null;
}
