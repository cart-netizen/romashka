import "server-only";
import { cookies } from "next/headers";
import { COOKIE } from "./auth";

const DIRECTUS_URL = (process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/$/, "");

export const DEAL_STATUS_FLOW = ["new", "ordered", "shipped", "delivered", "closed"] as const;
export type DealStatus = (typeof DEAL_STATUS_FLOW)[number];

export const DEAL_STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  ordered: "Заказано у фабрики",
  shipped: "Отгружено",
  delivered: "Доставлено",
  closed: "Закрыта",
};

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  accrued: "Начислено",
  ready_to_pay: "Готово к выплате",
  paid: "Выплачено",
};

export const MATERIAL_CATEGORY_LABELS: Record<string, string> = {
  price: "Прайс-листы",
  drawings: "Чертежи и 3D",
  textures: "Фактуры тканей",
  terms: "Условия сотрудничества",
  marketing: "Маркетинг",
};

export interface DealAttachment {
  id: string;
  filename_download: string | null;
  title: string | null;
}

export interface Deal {
  id: number;
  number: string | null;
  title: string;
  client_object: string | null;
  items: string | null;
  amount: number | null;
  status: string;
  commission_amount: number | null;
  commission_status: string | null;
  comment: string | null;
  created_at: string | null;
  updated_at: string | null;
  attachments?: { directus_files_id: DealAttachment }[];
}

export interface Material {
  id: number;
  title: string;
  description: string | null;
  file: string | null;
  url: string | null;
  category: string | null;
}

export interface Me {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

async function authed<T>(path: string): Promise<T | null> {
  const token = (await cookies()).get(COOKIE.access)?.value;
  if (!token) return null;
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return (json?.data ?? null) as T | null;
}

export async function getMe(): Promise<Me | null> {
  return authed<Me>("/users/me?fields=first_name,last_name,email");
}

const DEAL_LIST_FIELDS = "id,number,title,client_object,amount,status,commission_amount,commission_status,updated_at";

export async function getMyDeals(): Promise<Deal[]> {
  return (await authed<Deal[]>(`/items/deals?fields=${DEAL_LIST_FIELDS}&sort=-updated_at&limit=-1`)) ?? [];
}

export async function getMyDeal(id: number): Promise<Deal | null> {
  // фильтр по id (а не /items/deals/:id) → для чужой сделки вернётся пусто, а не 403
  const fields = [
    "id,number,title,client_object,items,amount,status,commission_amount,commission_status,comment,created_at,updated_at",
    "attachments.directus_files_id.id",
    "attachments.directus_files_id.filename_download",
    "attachments.directus_files_id.title",
  ].join(",");
  const rows = await authed<Deal[]>(`/items/deals?filter[id][_eq]=${id}&fields=${fields}&limit=1`);
  return rows?.[0] ?? null;
}

export async function getMaterials(): Promise<Material[]> {
  return (
    (await authed<Material[]>("/items/materials?fields=id,title,description,file,url,category&sort=sort&limit=-1")) ?? []
  );
}

export function assetDownloadUrl(id: string): string {
  const base = (process.env.NEXT_PUBLIC_DIRECTUS_URL ?? DIRECTUS_URL).replace(/\/$/, "");
  return `${base}/assets/${id}?download`;
}
