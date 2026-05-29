import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Accordion, type AccordionItem } from "@/components/ui/Accordion";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { UspBanner } from "@/components/product/UspBanner";
import { Rating } from "@/components/product/Rating";
import { ReviewsBlock } from "@/components/product/ReviewsBlock";
import {
  assetUrl,
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
  getReviews,
  getSiteSettings,
  getUspMessages,
} from "@/lib/directus";
import type { Category, Subcategory } from "@/lib/directus.types";
import { formatPriceFrom, reviewsLabel } from "@/lib/format";
import {
  productColors,
  productDimensionIds,
  productFactory,
  productGalleryIds,
  sizeLabel,
} from "@/lib/product";

export const revalidate = 120;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.short_description ?? `${product.name} — премиальная мебель в салоне «Ромашка».`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, reviews, usp, settings] = await Promise.all([
    getRelatedProducts(product, 5),
    getReviews(product.id),
    getUspMessages(),
    getSiteSettings(),
  ]);

  const galleryUrls = productGalleryIds(product)
    .map((id) => assetUrl(id, { width: 900, height: 900, fit: "cover" }))
    .filter((u): u is string => !!u);
  const dimensionUrls = productDimensionIds(product)
    .map((id) => assetUrl(id, { width: 1000 }))
    .filter((u): u is string => !!u);
  const colors = productColors(product);
  const factory = productFactory(product);
  const category = product.category && typeof product.category === "object" ? (product.category as Category) : null;
  const subcategory =
    product.subcategory && typeof product.subcategory === "object" ? (product.subcategory as Subcategory) : null;
  const sizes = (product.sizes ?? []).map(sizeLabel);
  const ratings = reviews.map((r) => r.rating ?? 0).filter((n) => n > 0);
  const average = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const leadTimeNote = product.lead_time_note ?? settings.default_lead_time_note;

  const accordionItems: AccordionItem[] = [];
  if (product.characteristics?.length) {
    accordionItems.push({
      title: "Материал изделия и уход",
      defaultOpen: true,
      content: (
        <table className="w-full border-collapse">
          <tbody>
            {product.characteristics.map((c, i) => (
              <tr key={i} className="border-b border-line/70 last:border-0">
                <td className="py-2 pr-4 align-top text-muted">{c.label}</td>
                <td className="py-2 align-top text-ink">{c.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    });
  }
  if (dimensionUrls.length || settings.dimensions_disclaimer) {
    accordionItems.push({
      title: "Фактические размеры",
      content: (
        <div>
          {dimensionUrls.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {dimensionUrls.map((u, i) => (
                <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-surface">
                  <Image src={u} alt={`Чертёж ${i + 1}`} fill sizes="(max-width: 640px) 100vw, 400px" className="object-contain" />
                </div>
              ))}
            </div>
          )}
          {settings.dimensions_disclaimer && (
            <p className="mt-4 text-xs text-muted">{settings.dimensions_disclaimer}</p>
          )}
        </div>
      ),
    });
  }
  if (product.description) {
    accordionItems.push({
      title: "Информация о товаре",
      content: <div className="space-y-3 [&_p]:m-0" dangerouslySetInnerHTML={{ __html: product.description }} />,
    });
  }

  return (
    <>
      <Container className="py-8">
        <Breadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "Каталог", href: "/catalog" },
            ...(category ? [{ label: category.name, href: `/catalog/${category.slug}` }] : []),
            ...(category && subcategory
              ? [{ label: subcategory.name, href: `/catalog/${category.slug}/${subcategory.slug}` }]
              : []),
            { label: product.name },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <ProductGallery images={galleryUrls} alt={product.name} />

          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl">{product.name}</h1>
              <FavoriteButton
                size="lg"
                item={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  priceFrom: product.price_from,
                  image: galleryUrls[0] ?? null,
                  factory: factory?.name ?? null,
                }}
                className="mt-1 shrink-0"
              />
            </div>

            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
              <Rating value={average} />
              <span>
                {average ? average.toFixed(1).replace(".", ",") : "Нет оценок"} · {reviewsLabel(reviews.length)}
              </span>
            </a>

            {product.sku && <p className="mt-3 text-sm text-muted">Артикул: {product.sku}</p>}

            <p className="mt-4 font-serif text-3xl text-ink">{formatPriceFrom(product.price_from)}</p>

            {colors.length > 0 && (
              <div className="mt-5 flex items-center gap-2">
                <span className="text-sm text-muted">Цвета:</span>
                <div className="flex items-center gap-1.5">
                  {colors.map((c) => (
                    <span
                      key={c.id}
                      title={c.name}
                      className="h-5 w-5 rounded-full border border-line"
                      style={{ backgroundColor: c.hex ?? "transparent" }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <ProductPurchasePanel
                productName={product.name}
                sizes={sizes}
                leadTimeNote={leadTimeNote}
                phone={settings.phone}
                messengerLink={settings.messenger_max_link}
              />
            </div>

            {usp.length > 0 && (
              <div className="mt-6">
                <UspBanner messages={usp.map((u) => u.text)} />
              </div>
            )}

            {factory && (
              <p className="mt-6 text-sm text-muted">
                Фабрика-производитель:{" "}
                <Link href={`/factories/${factory.slug}`} className="text-ink underline underline-offset-2 hover:text-terracotta">
                  {factory.name}
                </Link>
              </p>
            )}
          </div>
        </div>

        {accordionItems.length > 0 && (
          <div className="mx-auto mt-14 max-w-3xl">
            <Accordion items={accordionItems} />
          </div>
        )}
      </Container>

      {related.length > 0 && (
        <Container className="py-16">
          <SectionHeading title="Рекомендуем также" />
          <div className="mt-10">
            <ProductGrid products={related} />
          </div>
        </Container>
      )}

      <ReviewsBlock reviews={reviews} average={average} />
    </>
  );
}
