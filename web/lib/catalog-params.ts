// (Де)сериализация фильтров каталога ↔ URL searchParams. Чистый модуль (сервер+клиент).

export type SortKey = "default" | "price_asc" | "price_desc" | "new";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "По умолчанию" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
  { value: "new", label: "Сначала новые" },
];

export const PAGE_SIZE = 12;

export interface CatalogQuery {
  q?: string;
  inStock: boolean;
  factories: string[]; // slugs
  category?: string; // slug (на /catalog)
  subcategory?: string; // slug (на странице категории)
  frame: string[];
  upholstery: string[];
  colors: number[]; // id цветов
  priceMin?: number;
  priceMax?: number;
  widthMin?: number;
  widthMax?: number;
  heightMin?: number;
  heightMax?: number;
  depthMin?: number;
  depthMax?: number;
  sort: SortKey;
  page: number;
}

export type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function list(v: string | string[] | undefined): string[] {
  const s = first(v);
  return s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
}
function num(v: string | string[] | undefined): number | undefined {
  const s = first(v);
  if (s == null || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export function parseCatalogParams(params: RawParams): CatalogQuery {
  const sort = (first(params.sort) ?? "default") as SortKey;
  const page = Math.max(1, num(params.page) ?? 1);
  return {
    q: first(params.q)?.trim() || undefined,
    inStock: first(params.in_stock) === "1",
    factories: list(params.factory),
    category: first(params.category),
    subcategory: first(params.subcategory),
    frame: list(params.frame),
    upholstery: list(params.upholstery),
    colors: list(params.colors).map(Number).filter(Number.isFinite),
    priceMin: num(params.price_min),
    priceMax: num(params.price_max),
    widthMin: num(params.w_min),
    widthMax: num(params.w_max),
    heightMin: num(params.h_min),
    heightMax: num(params.h_max),
    depthMin: num(params.d_min),
    depthMax: num(params.d_max),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : "default",
    page,
  };
}

/** Сериализация в URLSearchParams (опускаем пустые/дефолтные значения). */
export function buildCatalogParams(q: Partial<CatalogQuery>): URLSearchParams {
  const sp = new URLSearchParams();
  if (q.q) sp.set("q", q.q);
  if (q.inStock) sp.set("in_stock", "1");
  if (q.factories?.length) sp.set("factory", q.factories.join(","));
  if (q.category) sp.set("category", q.category);
  if (q.subcategory) sp.set("subcategory", q.subcategory);
  if (q.frame?.length) sp.set("frame", q.frame.join(","));
  if (q.upholstery?.length) sp.set("upholstery", q.upholstery.join(","));
  if (q.colors?.length) sp.set("colors", q.colors.join(","));
  if (q.priceMin != null) sp.set("price_min", String(q.priceMin));
  if (q.priceMax != null) sp.set("price_max", String(q.priceMax));
  if (q.widthMin != null) sp.set("w_min", String(q.widthMin));
  if (q.widthMax != null) sp.set("w_max", String(q.widthMax));
  if (q.heightMin != null) sp.set("h_min", String(q.heightMin));
  if (q.heightMax != null) sp.set("h_max", String(q.heightMax));
  if (q.depthMin != null) sp.set("d_min", String(q.depthMin));
  if (q.depthMax != null) sp.set("d_max", String(q.depthMax));
  if (q.sort && q.sort !== "default") sp.set("sort", q.sort);
  if (q.page && q.page > 1) sp.set("page", String(q.page));
  return sp;
}

/** Число активных фильтров (без сортировки/страницы/поиска) — для бейджа на мобайле. */
export function countActiveFilters(q: CatalogQuery): number {
  let n = 0;
  if (q.inStock) n++;
  n += q.factories.length + q.frame.length + q.upholstery.length + q.colors.length;
  if (q.priceMin != null || q.priceMax != null) n++;
  if (q.widthMin != null || q.widthMax != null) n++;
  if (q.heightMin != null || q.heightMax != null) n++;
  if (q.depthMin != null || q.depthMax != null) n++;
  if (q.subcategory) n++;
  if (q.category) n++;
  return n;
}
