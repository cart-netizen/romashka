// Типы коллекций Directus (соответствуют схеме cms/scripts/schema.mjs).
// Связи приходят либо как id (string|number), либо как развёрнутый объект —
// в зависимости от запрошенных fields.

export type Status = "published" | "draft" | "archived";

export interface Color {
  id: number;
  name: string;
  hex: string | null;
  sort: number | null;
}

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  category: number | Category;
  sort: number | null;
  status: Status;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  hero_image: string | null;
  sort: number | null;
  status: Status;
  subcategories?: Subcategory[];
}

export interface MenuPromo {
  id: number;
  title: string;
  image: string | null;
  link: string | null;
  sort: number | null;
  category: number | Category;
  status: Status;
}

export interface Factory {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  sort: number | null;
  status: Status;
}

export interface ProductSize {
  label: string;
  width_cm: number | string | null;
  height_cm: number | string | null;
  depth_cm: number | string | null;
}

export interface ProductCharacteristic {
  label: string;
  value: string;
}

export interface ColorJunction {
  colors_id: Color;
}

export interface FileJunction {
  directus_files_id: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  price_from: number | null;
  short_description: string | null;
  description: string | null;
  main_image: string | null;
  gallery: FileJunction[];
  frame: string | null;
  upholstery: string[] | null;
  colors: ColorJunction[];
  characteristics: ProductCharacteristic[] | null;
  sizes: ProductSize[] | null;
  dimensions_images: FileJunction[];
  lead_time_note: string | null;
  width_cm: number | null;
  height_cm: number | null;
  depth_cm: number | null;
  variants_count: number | null;
  style: string | null;
  is_bestseller: boolean;
  is_new: boolean;
  is_sale: boolean;
  in_stock: boolean;
  category: Category | number | null;
  subcategory: Subcategory | number | null;
  factory: Factory | number | null;
  sort: number | null;
  status: Status;
}

export interface Review {
  id: number;
  product: number | Product;
  author_name: string | null;
  rating: number | null;
  text: string | null;
  status: Status;
  created_at: string | null;
}

export interface SiteSettings {
  phone: string | null;
  email: string | null;
  work_hours: string | null;
  address: string | null;
  map_embed: string | null;
  messenger_max_link: string | null;
  vk_link: string | null;
  telegram_link: string | null;
  seo_default_title: string | null;
  seo_default_description: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_video: string | null;
  timeline_title: string | null;
  timeline_image: string | null;
  dimensions_disclaimer: string | null;
  default_lead_time_note: string | null;
  promo_amount: number | null;
  promo_code_prefix: string | null;
  promo_static_code: string | null;
}

// Карта подписей для enum-полей (для отображения на фронте).
export const FRAME_LABELS: Record<string, string> = {
  massiv: "Массив",
  metal: "Металл",
  fanera: "Фанера",
};

export const UPHOLSTERY_LABELS: Record<string, string> = {
  boucle: "Букле",
  jacquard: "Жаккард",
  linen: "Лён",
  leather: "Натуральная кожа",
  blended: "Смесовая ткань",
  chenille: "Шенилл",
};
