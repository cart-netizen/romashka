import Link from "next/link";
import Image from "next/image";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ArrowRightIcon } from "@/components/ui/icons";
import { assetUrl } from "@/lib/directus";
import type { Product } from "@/lib/directus.types";
import { formatPriceFrom } from "@/lib/format";
import { productFactory } from "@/lib/product";

/** Горизонтальный слайдер карточек-товаров (как блок «Ещё больше причин влюбиться»
 *  на референсе). Без корзины: круглые кнопки — переход к товару и «в избранное». */
export function BestsellerStrip({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:px-0">
      <div className="flex snap-x gap-8">
        {products.map((p) => {
          const img = assetUrl(p.main_image, { width: 600, height: 500, fit: "contain" });
          const factory = productFactory(p);
          const badge = p.is_sale ? "Распродажа" : p.is_new ? "Новинка" : p.is_bestseller ? "Хит" : null;
          return (
            <article key={p.id} className="w-[240px] shrink-0 snap-start sm:w-[270px]">
              <Link href={`/product/${p.slug}`} className="group block">
                <div className="relative mb-5 aspect-[1/0.82] overflow-hidden rounded-[var(--radius-card)] bg-surface">
                  {badge && (
                    <span className="absolute left-4 top-4 z-10 inline-flex h-[26px] items-center bg-terracotta px-3 text-xs text-cream">
                      {badge}
                    </span>
                  )}
                  {img && (
                    <Image
                      src={img}
                      alt={p.name}
                      fill
                      sizes="270px"
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                {factory && <span className="text-xs uppercase tracking-wider text-muted">{factory.name}</span>}
                <h3 className="mt-1 font-serif text-base font-medium leading-snug text-ink">{p.name}</h3>
                <p className="mt-2 font-price text-xl text-ink">{formatPriceFrom(p.price_from)}</p>
              </Link>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/product/${p.slug}`}
                  aria-label={`Перейти к товару ${p.name}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink text-ink transition-colors hover:bg-ink hover:text-cream"
                >
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <FavoriteButton
                  item={{ id: p.id, slug: p.slug, name: p.name, priceFrom: p.price_from, image: img, factory: factory?.name ?? null }}
                  className="h-10 w-10 border border-ink"
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
