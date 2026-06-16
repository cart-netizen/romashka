import "server-only";
import type {
  Category,
  Color,
  Factory,
  MenuPromo,
  Product,
  Review,
  SiteSettings,
  Subcategory,
} from "./directus.types";
import { type CatalogQuery, PAGE_SIZE } from "./catalog-params";

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
  fallback?: unknown; // используется только при сбое во время сборки
}

// Во время прод-сборки бэкенд может быть недоступен — тогда отдаём fallback,
// чтобы собрать образ без БД (данные подтянутся в рантайме через ISR).
// В рантайме ошибки пробрасываются (видимость проблем).
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

function onFetchError<T>(path: string, err: unknown, fallback: T): T {
  if (IS_BUILD) {
    console.warn(`[directus] сборка без бэкенда: ${path} → fallback (${(err as Error).message})`);
    return fallback;
  }
  throw err instanceof Error ? err : new Error(String(err));
}

async function dGet<T>(
  collectionPath: string,
  params: Record<string, QueryValue> = {},
  opts: FetchOpts = {},
): Promise<T> {
  const url = `${DIRECTUS_URL}${collectionPath}${buildQuery(params)}`;
  try {
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
  } catch (e) {
    return onFetchError(collectionPath, e, (opts.fallback ?? []) as T);
  }
}

async function dGetMeta<T>(
  collectionPath: string,
  params: Record<string, QueryValue> = {},
  opts: FetchOpts = {},
): Promise<{ data: T; total: number }> {
  const url = `${DIRECTUS_URL}${collectionPath}${buildQuery({ ...params, meta: "filter_count" })}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: opts.revalidate ?? DEFAULT_REVALIDATE, tags: opts.tags },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Directus ${collectionPath} → ${res.status}: ${body.slice(0, 200)}`);
    }
    const json = await res.json();
    return { data: json.data as T, total: json.meta?.filter_count ?? (json.data as unknown[]).length };
  } catch (e) {
    return onFetchError(collectionPath, e, { data: (opts.fallback ?? []) as T, total: 0 });
  }
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
  "size_variants.id",
  "size_variants.label",
  "size_variants.width_cm",
  "size_variants.height_cm",
  "size_variants.depth_cm",
  "size_variants.price",
  "size_variants.image",
  "size_variants.dimensions_image",
  "size_variants.sort",
  "colors.colors_id.id",
  "colors.colors_id.name",
  "colors.colors_id.hex",
  "colors.colors_id.swatch_image",
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
  return dGet<SiteSettings>("/items/site_settings", { fields: "*" }, { tags: ["site_settings"], fallback: {} });
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

export async function getColors(): Promise<Color[]> {
  return dGet<Color[]>(
    "/items/colors",
    { fields: "id,name,hex,sort", sort: "sort", limit: -1 },
    { tags: ["colors"] },
  );
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

// Каталог с фильтрами/сортировкой/пагинацией + общее число (для пагинации).
const SORT_MAP: Record<CatalogQuery["sort"], string> = {
  default: "sort",
  price_asc: "price_from",
  price_desc: "-price_from",
  new: "-id",
};

export async function getCatalog(q: CatalogQuery): Promise<{ items: Product[]; total: number }> {
  const and: Record<string, unknown>[] = [{ status: { _eq: "published" } }];
  if (q.category) and.push({ category: { slug: { _eq: q.category } } });
  if (q.subcategory) and.push({ subcategory: { slug: { _eq: q.subcategory } } });
  if (q.inStock) and.push({ in_stock: { _eq: true } });
  if (q.badge === "new") and.push({ is_new: { _eq: true } });
  else if (q.badge === "hit") and.push({ is_bestseller: { _eq: true } });
  else if (q.badge === "sale") and.push({ is_sale: { _eq: true } });
  if (q.factories.length) and.push({ factory: { slug: { _in: q.factories } } });
  if (q.frame.length) and.push({ frame: { _in: q.frame } });
  if (q.upholstery.length) and.push({ _or: q.upholstery.map((v) => ({ upholstery: { _contains: v } })) });
  if (q.colors.length) and.push({ colors: { colors_id: { id: { _in: q.colors } } } });
  if (q.priceMin != null) and.push({ price_from: { _gte: q.priceMin } });
  if (q.priceMax != null) and.push({ price_from: { _lte: q.priceMax } });
  if (q.widthMin != null) and.push({ width_cm: { _gte: q.widthMin } });
  if (q.widthMax != null) and.push({ width_cm: { _lte: q.widthMax } });
  if (q.heightMin != null) and.push({ height_cm: { _gte: q.heightMin } });
  if (q.heightMax != null) and.push({ height_cm: { _lte: q.heightMax } });
  if (q.depthMin != null) and.push({ depth_cm: { _gte: q.depthMin } });
  if (q.depthMax != null) and.push({ depth_cm: { _lte: q.depthMax } });

  const params: Record<string, QueryValue> = {
    fields: PRODUCT_CARD_FIELDS,
    filter: { _and: and },
    sort: SORT_MAP[q.sort],
    limit: PAGE_SIZE,
    page: q.page,
  };
  if (q.q) params.search = q.q;

  const { data, total } = await dGetMeta<Product[]>("/items/products", params, { tags: ["products"] });
  return { items: data, total };
}

export interface CatalogFacets {
  factories: Factory[];
  colors: Color[];
  subcategories: Subcategory[];
  categories: Category[];
  priceMin: number;
  priceMax: number;
  widthMax: number;
  heightMax: number;
  depthMax: number;
}

export async function getCatalogFacets(categorySlug?: string): Promise<CatalogFacets> {
  const aggFilter: Record<string, unknown> = { status: { _eq: "published" } };
  if (categorySlug) aggFilter.category = { slug: { _eq: categorySlug } };

  const [factories, colors, categories, subcategories, agg] = await Promise.all([
    getFactories(),
    getColors(),
    getCategories(),
    categorySlug ? getSubcategories(categorySlug) : Promise.resolve([] as Subcategory[]),
    dGet<{ min: Record<string, number>; max: Record<string, number> }[]>(
      "/items/products",
      {
        filter: aggFilter,
        "aggregate[min]": "price_from",
        "aggregate[max]": "price_from,width_cm,height_cm,depth_cm",
      },
      { tags: ["products"] },
    ),
  ]);

  const min = agg[0]?.min ?? {};
  const max = agg[0]?.max ?? {};
  return {
    factories,
    colors,
    categories,
    subcategories,
    priceMin: Math.floor(min.price_from ?? 0),
    priceMax: Math.ceil(max.price_from ?? 0),
    widthMax: Math.ceil(max.width_cm ?? 0),
    heightMax: Math.ceil(max.height_cm ?? 0),
    depthMax: Math.ceil(max.depth_cm ?? 0),
  };
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

// ── Shop the look (интерактивные сцены) ──────────────────────────────────────

export interface SceneHotspot {
  id: number;
  pos_x: number;
  pos_y: number;
  product: { name: string; slug: string; price_from: number | null } | null;
}

export interface ShowcaseScene {
  id: number;
  title: string;
  image: string | null;
  hotspots: SceneHotspot[];
}

export async function getShowcaseScenes(): Promise<ShowcaseScene[]> {
  const [scenes, hotspots] = await Promise.all([
    dGet<{ id: number; title: string; image: string | null }[]>(
      "/items/showcase_scenes",
      { fields: "id,title,image,sort", filter: PUBLISHED, sort: "sort", limit: 5 },
      { tags: ["showcase"] },
    ),
    dGet<
      {
        id: number;
        scene: number;
        pos_x: number;
        pos_y: number;
        product: { name: string; slug: string; price_from: number | null; status: string } | null;
      }[]
    >(
      "/items/showcase_hotspots",
      {
        fields: "id,scene,pos_x,pos_y,sort,product.name,product.slug,product.price_from,product.status",
        filter: { product: { status: { _eq: "published" } } },
        sort: "sort",
        limit: -1,
      },
      { tags: ["showcase"] },
    ),
  ]);

  return scenes.map((s) => ({
    id: s.id,
    title: s.title,
    image: s.image,
    hotspots: hotspots
      .filter((h) => h.scene === s.id && h.product)
      .map((h) => ({
        id: h.id,
        pos_x: Number(h.pos_x),
        pos_y: Number(h.pos_y),
        product: h.product
          ? { name: h.product.name, slug: h.product.slug, price_from: h.product.price_from }
          : null,
      })),
  }));
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
