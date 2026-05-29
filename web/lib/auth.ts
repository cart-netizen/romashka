// Авторизация дизайнеров через Directus. Прямой fetch (используется и в
// middleware, и в server actions) — без 'server-only'.

const DIRECTUS_URL = (process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/$/, "");

export const COOKIE = {
  access: "d_access",
  refresh: "d_refresh",
  expires: "d_expires",
} as const;

export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires: number; // мс до истечения access
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

async function authFetch(path: string, body: object): Promise<AuthTokens> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.message ?? `Auth ${path} → ${res.status}`);
  }
  return json.data as AuthTokens;
}

export function directusLogin(email: string, password: string): Promise<AuthTokens> {
  return authFetch("/auth/login", { email, password, mode: "json" });
}

export function directusRefresh(refreshToken: string): Promise<AuthTokens> {
  return authFetch("/auth/refresh", { refresh_token: refreshToken, mode: "json" });
}

export async function directusLogout(refreshToken: string): Promise<void> {
  try {
    await fetch(`${DIRECTUS_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
      cache: "no-store",
    });
  } catch {
    // logout best-effort
  }
}
