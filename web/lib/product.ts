// Чистые помощники для извлечения данных из товара (без серверных импортов).
import type { Color, Factory, Product, ProductSize } from "./directus.types";

export function productColors(product: Pick<Product, "colors">): Color[] {
  return (product.colors ?? []).map((c) => c.colors_id).filter(Boolean);
}

export function productGalleryIds(product: Pick<Product, "gallery" | "main_image">): string[] {
  const ids = (product.gallery ?? []).map((g) => g.directus_files_id).filter(Boolean);
  if (product.main_image && !ids.includes(product.main_image)) ids.unshift(product.main_image);
  return ids;
}

export function productDimensionIds(product: Pick<Product, "dimensions_images">): string[] {
  return (product.dimensions_images ?? []).map((g) => g.directus_files_id).filter(Boolean);
}

export function productFactory(product: Pick<Product, "factory">): Factory | null {
  return product.factory && typeof product.factory === "object" ? product.factory : null;
}

export function sizeLabel(size: ProductSize): string {
  const dims = [size.width_cm, size.height_cm, size.depth_cm].filter((v) => v != null && v !== "");
  const measures = dims.length ? `${dims.join("×")} см` : "";
  if (size.label && measures) return `${size.label} · ${measures}`;
  return size.label || measures || "—";
}

export function variantsCount(product: Pick<Product, "variants_count" | "sizes">): number {
  return product.variants_count ?? product.sizes?.length ?? 0;
}
