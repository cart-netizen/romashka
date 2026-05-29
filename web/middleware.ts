import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, REFRESH_MAX_AGE, cookieOptions, directusRefresh } from "@/lib/auth";

export const config = {
  matcher: ["/cabinet/:path*"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Логин доступен без авторизации
  if (pathname === "/cabinet/login") return NextResponse.next();

  const refresh = req.cookies.get(COOKIE.refresh)?.value;
  if (!refresh) return redirectLogin(req);

  const access = req.cookies.get(COOKIE.access)?.value;
  const expires = Number(req.cookies.get(COOKIE.expires)?.value || 0);

  // Access ещё валиден — пропускаем
  if (access && Date.now() < expires - 30_000) return NextResponse.next();

  // Иначе обновляем access по refresh-токену
  try {
    const tokens = await directusRefresh(refresh);
    // обновляем куки запроса (видны текущему рендеру) и ответа (сохраняются в браузере)
    req.cookies.set(COOKIE.access, tokens.access_token);
    req.cookies.set(COOKIE.expires, String(Date.now() + tokens.expires));
    req.cookies.set(COOKIE.refresh, tokens.refresh_token);

    const res = NextResponse.next({ request: { headers: req.headers } });
    res.cookies.set(COOKIE.access, tokens.access_token, cookieOptions(Math.floor(tokens.expires / 1000)));
    res.cookies.set(COOKIE.refresh, tokens.refresh_token, cookieOptions(REFRESH_MAX_AGE));
    res.cookies.set(COOKIE.expires, String(Date.now() + tokens.expires), cookieOptions(REFRESH_MAX_AGE));
    return res;
  } catch {
    return redirectLogin(req, true);
  }
}

function redirectLogin(req: NextRequest, clear = false) {
  const res = NextResponse.redirect(new URL("/cabinet/login", req.url));
  if (clear) {
    res.cookies.delete(COOKIE.access);
    res.cookies.delete(COOKIE.refresh);
    res.cookies.delete(COOKIE.expires);
  }
  return res;
}
