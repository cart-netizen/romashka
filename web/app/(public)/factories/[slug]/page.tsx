import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { assetUrl, getFactories, getFactoryBySlug, getProducts } from "@/lib/directus";

export const revalidate = 300;

export async function generateStaticParams() {
  const factories = await getFactories();
  return factories.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const factory = await getFactoryBySlug(slug);
  if (!factory) return {};
  return { title: factory.name, description: `Ассортимент фабрики ${factory.name} в салоне «Ромашка».` };
}

export default async function FactoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const factory = await getFactoryBySlug(slug);
  if (!factory) notFound();

  const products = await getProducts({ factorySlug: slug, limit: -1 });
  const logo = assetUrl(factory.logo, { width: 800, height: 480, fit: "cover" });

  return (
    <>
      <PageHeader crumbs={[{ label: "Главная", href: "/" }, { label: "Фабрики", href: "/factories" }, { label: factory.name }]} title={factory.name} />

      <Container className="py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          {logo && (
            <div className="relative aspect-[5/3] overflow-hidden rounded-[var(--radius-card)] bg-ink/5">
              <Image src={logo} alt={factory.name} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
            </div>
          )}
          <div>
            {factory.description ? (
              <div
                className="space-y-3 leading-relaxed text-ink/90 [&_p]:m-0"
                dangerouslySetInnerHTML={{ __html: factory.description }}
              />
            ) : (
              <p className="text-muted">Описание фабрики появится позже.</p>
            )}
            {factory.website && (
              <a
                href={factory.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block text-sm text-terracotta underline underline-offset-2"
              >
                Сайт фабрики
              </a>
            )}
          </div>
        </div>
      </Container>

      {products.length > 0 && (
        <Container className="pb-16">
          <SectionHeading title={`Ассортимент: ${factory.name}`} align="left" />
          <div className="mt-8">
            <ProductGrid products={products} />
          </div>
        </Container>
      )}
    </>
  );
}
