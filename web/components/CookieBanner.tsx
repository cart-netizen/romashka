"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const KEY = "romashka:cookie-consent";
const EVENT = "romashka:cookie-consent-change";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
function getSnapshot(): string | null {
  return window.localStorage.getItem(KEY);
}

export function CookieBanner() {
  // На сервере и до согласия — getServerSnapshot вернёт "ssr"; баннер скрыт до маунта.
  const value = useSyncExternalStore(subscribe, getSnapshot, () => "ssr");
  if (value !== null) return null; // "ssr" или "accepted" → не показываем

  const accept = () => {
    window.localStorage.setItem(KEY, "accepted");
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-line bg-cream/95 backdrop-blur print:hidden">
      <Container className="flex flex-col items-center gap-3 py-4 text-sm text-ink sm:flex-row sm:justify-between">
        <p className="text-muted">
          Мы используем файлы cookie для работы сайта и аналитики. Продолжая пользоваться сайтом, вы соглашаетесь с{" "}
          <Link href="/privacy" className="text-ink underline underline-offset-2 hover:text-terracotta">
            политикой конфиденциальности
          </Link>
          .
        </p>
        <Button size="sm" onClick={accept} className="shrink-0">
          Принять
        </Button>
      </Container>
    </div>
  );
}
