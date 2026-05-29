import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { logoutAction } from "@/lib/auth-actions";
import { getMe } from "@/lib/cabinet";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/cabinet", label: "Дашборд" },
  { href: "/cabinet/materials", label: "Материалы" },
  { href: "/cabinet/deals", label: "Сделки" },
];

export default async function CabinetLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  const name = [me?.first_name, me?.last_name].filter(Boolean).join(" ") || me?.email || "Дизайнер";

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-line bg-surface">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/cabinet" className="font-serif text-xl font-semibold uppercase tracking-[0.18em] text-ink">
              Ромашка
            </Link>
            <nav className="hidden items-center gap-6 text-sm sm:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="text-ink/80 transition-colors hover:text-terracotta">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted md:inline">{name}</span>
            <Link href="/" className="text-ink/70 hover:text-terracotta">
              На сайт
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="rounded-[var(--radius-card)] border border-line px-3 py-1.5 text-ink hover:border-ink">
                Выйти
              </button>
            </form>
          </div>
        </Container>
        <nav className="flex items-center gap-5 border-t border-line px-4 py-2 text-sm sm:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-ink/80 hover:text-terracotta">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Container className="py-10">{children}</Container>
      </main>
    </div>
  );
}
