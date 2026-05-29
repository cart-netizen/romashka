import Link from "next/link";
import Image from "next/image";
import { FavoriteButton } from "@/components/FavoriteButton";
import { assetUrl } from "@/lib/directus";
import type { Product } from "@/lib/directus.types";
import { formatPriceFrom, sizesAvailableLabel } from "@/lib/format";
import { productColors, productFactory, variantsCount } from "@/lib/product";

export function ProductCard({ product }: { product: Product }) {
  const img = assetUrl(product.main_image, { width: 600, height: 600, fit: "cover" });
  const colors = productColors(product).slice(0, 6);
  const factory = productFactory(product);
  const variants = variantsCount(product);

  return (
    <article className="group relative flex flex-col">
      <FavoriteButton
        item={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          priceFrom: product.price_from,
          image: img,
          factory: factory?.name ?? null,
        }}
        className="absolute right-3 top-3 z-10 bg-cream/70 p-1.5 backdrop-blur-sm"
      />

      <Link href={`/product/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-surface">
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">нет фото</div>
          )}

          <div className="absolute left-3 top-3 flex flex-col gap-1">
            {product.is_new && <Badge>Новинка</Badge>}
            {product.is_sale && <Badge tone="cta">Распродажа</Badge>}
            {product.is_bestseller && <Badge tone="burgundy">Хит</Badge>}
          </div>
          {!product.in_stock && (
            <span className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs text-cream">
              Под заказ
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col pt-4">
          {factory && <span className="text-xs uppercase tracking-wider text-muted">{factory.name}</span>}
          <h3 className="mt-1 font-serif text-lg leading-snug text-ink">{product.name}</h3>
          {product.short_description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted">{product.short_description}</p>
          )}

          {variants > 0 && <span className="mt-2 text-xs text-muted">{sizesAvailableLabel(variants)}</span>}

          {colors.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              {colors.map((c) => (
                <span
                  key={c.id}
                  title={c.name}
                  className="h-4 w-4 rounded-full border border-line"
                  style={{ backgroundColor: c.hex ?? "transparent" }}
                />
              ))}
            </div>
          )}

          <p className="mt-3 font-serif text-xl text-ink">{formatPriceFrom(product.price_from)}</p>
        </div>
      </Link>
    </article>
  );
}

function Badge({ children, tone = "terracotta" }: { children: React.ReactNode; tone?: "terracotta" | "cta" | "burgundy" }) {
  const tones = {
    terracotta: "bg-terracotta text-cream",
    cta: "bg-cta text-cream",
    burgundy: "bg-burgundy text-cream",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
