"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { loginAction, type LoginState } from "@/lib/auth-actions";

export default function CabinetLoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <Link href="/" className="font-serif text-2xl font-semibold uppercase tracking-[0.18em] text-ink">
        Ромашка
      </Link>

      <div className="mt-8 w-full max-w-md rounded-[var(--radius-card)] border border-line bg-surface p-8 shadow-[var(--shadow-soft)]">
        <h1 className="text-2xl">Кабинет дизайнера</h1>
        <p className="mt-2 text-sm text-muted">
          Доступ к материалам и статусу ваших сделок. Учётную запись создаёт администратор.
        </p>

        <form action={action} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
          </div>

          {state.error && (
            <p className="rounded-[var(--radius-card)] border border-cta/40 bg-cta/10 px-3 py-2 text-sm text-ink">
              {state.error}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" disabled={pending}>
            {pending ? "Вход…" : "Войти"}
          </Button>
        </form>

        <Link href="/" className="mt-6 inline-block text-sm text-muted underline underline-offset-2 hover:text-ink">
          ← На главную
        </Link>
      </div>
    </main>
  );
}
