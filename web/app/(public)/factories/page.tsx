import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ArrowRightIcon } from "@/components/ui/icons";
import { assetUrl, getFactories } from "@/lib/directus";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Фабрики-партнёры",
  description: "Мебельные фабрики-партнёры салона «Ромашка»: логотипы, описание и ассортимент.",
};

export default async function FactoriesPage() {
  const factories = await getFactories();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Главная", href: "/" }, { label: "Фабрики" }]}
        title="Фабрики-партнёры"
        description="Работаем напрямую с проверенными производителями премиальной мебели."
      />
      <Container className="py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {factories.map((f) => {
            const logo = assetUrl(f.logo, { width: 600, height: 360, fit: "cover" });
            return (
              <Link
                key={f.id}
                href={`/factories/${f.slug}`}
                className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-colors hover:border-terracotta"
              >
                <div className="relative aspect-[5/3] bg-ink/5">
                  {logo && <Image src={logo} alt={f.name} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover" />}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-serif text-xl text-ink">{f.name}</h2>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-terracotta">
                    Ассортимент фабрики
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </>
  );
}
