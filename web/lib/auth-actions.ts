"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  COOKIE,
  REFRESH_MAX_AGE,
  cookieOptions,
  directusLogin,
  directusLogout,
} from "./auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Введите e-mail и пароль" };

  let tokens;
  try {
    tokens = await directusLogin(email, password);
  } catch {
    return { error: "Неверный e-mail или пароль" };
  }

  const c = await cookies();
  c.set(COOKIE.access, tokens.access_token, cookieOptions(Math.floor(tokens.expires / 1000)));
  c.set(COOKIE.refresh, tokens.refresh_token, cookieOptions(REFRESH_MAX_AGE));
  c.set(COOKIE.expires, String(Date.now() + tokens.expires), cookieOptions(REFRESH_MAX_AGE));

  redirect("/cabinet");
}

export async function logoutAction(): Promise<void> {
  const c = await cookies();
  const refresh = c.get(COOKIE.refresh)?.value;
  if (refresh) await directusLogout(refresh);
  c.delete(COOKIE.access);
  c.delete(COOKIE.refresh);
  c.delete(COOKIE.expires);
  redirect("/cabinet/login");
}
