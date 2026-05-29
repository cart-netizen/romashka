"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { NavCategory } from "./nav.types";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";

function Logo() {
  return (
    <Link
      href="/"
      className="font-serif text-2xl font-semibold uppercase tracking-[0.18em] text-ink"
      aria-label="Ромашка — на главную"
    >
      Ромашка
    </Link>
  );
}

export function Navbar({ nav }: { nav: NavCategory[] }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = nav.find((c) => c.id === activeId) ?? null;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-cream/95 backdrop-blur">
        {/* группа наведения: пункты + выпадающая панель */}
        <div onMouseLeave={() => setActiveId(null)}>
          <Container className="flex h-18 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-ink lg:hidden"
                aria-label="Меню"
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              <Logo />
            </div>

            <nav className="hidden items-center gap-7 lg:flex">
              {nav.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalog/${cat.slug}`}
                  onMouseEnter={() => setActiveId(cat.id)}
                  onFocus={() => setActiveId(cat.id)}
                  className={cn(
                    "relative py-6 text-sm transition-colors hover:text-ink",
                    activeId === cat.id ? "text-ink" : "text-ink/80",
                  )}
                >
                  {cat.name}
                  <span
                    className={cn(
                      "absolute inset-x-0 -bottom-px h-0.5 bg-terracotta transition-transform",
                      activeId === cat.id ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4 text-ink">
              <Link href="/catalog" aria-label="Поиск по каталогу" className="hover:text-terracotta">
                <SearchIcon />
              </Link>
              <Link href="/cabinet/login" aria-label="Кабинет дизайнера" className="hover:text-terracotta">
                <UserIcon />
              </Link>
              <Link href="/favorites" aria-label="Избранное" className="hover:text-terracotta">
                <HeartIcon />
              </Link>
            </div>
          </Container>

          {active && <MegaMenu category={active} onNavigate={() => setActiveId(null)} />}
        </div>
      </header>

      {/* затемнение страницы под открытым mega-menu */}
      {active && (
        <div
          className="fixed inset-0 top-18 z-40 bg-ink/40"
          aria-hidden="true"
          onClick={() => setActiveId(null)}
        />
      )}

      <MobileMenu nav={nav} open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
