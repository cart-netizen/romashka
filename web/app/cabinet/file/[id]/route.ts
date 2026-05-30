import { cookies } from "next/headers";
import { COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTUS_URL = (process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/$/, "");

// Прокси приватных файлов кабинета: стримит /assets/:id от имени дизайнера
// (токен из httpOnly-куки). Доступ определяется RBAC Directus.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get(COOKIE.access)?.value;
  if (!token) return new Response("Unauthorized", { status: 401 });

  const upstream = await fetch(`${DIRECTUS_URL}/assets/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!upstream.ok || !upstream.body) {
    return new Response("Not found", { status: upstream.status === 403 ? 403 : 404 });
  }

  const headers = new Headers();
  const ct = upstream.headers.get("content-type");
  const cd = upstream.headers.get("content-disposition");
  const len = upstream.headers.get("content-length");
  if (ct) headers.set("content-type", ct);
  if (cd) headers.set("content-disposition", cd);
  if (len) headers.set("content-length", len);
  headers.set("cache-control", "private, no-store");

  return new Response(upstream.body, { status: 200, headers });
}
