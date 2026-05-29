"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function CabinetLoginPage() {
  const [notice, setNotice] = useState<string | null>(null);

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

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setNotice("Авторизация подключается на следующем этапе. Свяжитесь с менеджером для доступа.");
          }}
        >
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
          </div>

          {notice && (
            <p className="rounded-[var(--radius-card)] border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-sm text-ink">
              {notice}
            </p>
          )}

          <Button type="submit" fullWidth size="lg">
            Войти
          </Button>
        </form>

        <Link href="/" className="mt-6 inline-block text-sm text-muted underline underline-offset-2 hover:text-ink">
          ← На главную
        </Link>
      </div>
    </main>
  );
}
