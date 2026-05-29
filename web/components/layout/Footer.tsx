import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { getCategories, getSiteSettings } from "@/lib/directus";

const INFO_LINKS = [
  { href: "/about", label: "О компании" },
  { href: "/delivery", label: "Доставка и условия" },
  { href: "/factories", label: "Фабрики-партнёры" },
  { href: "/privacy", label: "Политика конфиденциальности" },
];

export async function Footer() {
  const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()]);

  return (
    <footer className="mt-24 bg-burgundy text-cream/90">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="font-serif text-2xl font-semibold uppercase tracking-[0.18em] text-cream">
            Ромашка
          </span>
          <p className="mt-4 max-w-xs text-sm text-cream/70">
            Салон премиальной мебели от фабрик-партнёров. Барнаул · доставка и сборка по Сибири.
          </p>
        </div>

        <nav>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-cream">Каталог</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/catalog/${c.slug}`} className="text-cream/75 transition-colors hover:text-cream">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-cream">Информация</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {INFO_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-cream/75 transition-colors hover:text-cream">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-cream">Контакты</h3>
          <ul className="mt-4 space-y-3 text-sm text-cream/80">
            {settings.phone && (
              <li className="flex items-start gap-2.5">
                <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="hover:text-cream">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.email && (
              <li className="flex items-start gap-2.5">
                <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <a href={`mailto:${settings.email}`} className="hover:text-cream">
                  {settings.email}
                </a>
              </li>
            )}
            {settings.address && (
              <li className="flex items-start gap-2.5">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <span>{settings.address}</span>
              </li>
            )}
            {settings.work_hours && (
              <li className="flex items-start gap-2.5">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                <span>{settings.work_hours}</span>
              </li>
            )}
          </ul>
        </div>
      </Container>

      <div className="border-t border-cream/15">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-cream/60 sm:flex-row">
          <span>© {new Date().getFullYear()} ООО «Ромашка». Все права защищены.</span>
          <Link href="/privacy" className="hover:text-cream">
            Политика конфиденциальности
          </Link>
        </Container>
      </div>
    </footer>
  );
}
