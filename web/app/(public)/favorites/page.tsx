"use client";

import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { CloseIcon, HeartIcon } from "@/components/ui/icons";
import { formatPriceFrom } from "@/lib/format";
import { removeFavorite, useFavorites } from "@/lib/favorites";

export default function FavoritesPage() {
  const items = useFavorites();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Главная", href: "/" }, { label: "Избранное" }]}
        title="Избранное"
        description="Отложенные товары хранятся в этом браузере."
      />
      <Container className="py-12">
        {items.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line py-16 text-center">
            <HeartIcon className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-4 text-lg text-ink">В избранном пока пусто</p>
            <p className="mt-2 text-sm text-muted">Добавляйте понравившиеся модели — они сохранятся здесь.</p>
            <div className="mt-6">
              <ButtonLink href="/catalog">Перейти в каталог</ButtonLink>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              <article key={it.id} className="group relative flex flex-col">
                <button
                  type="button"
                  aria-label="Убрать из избранного"
                  onClick={() => removeFavorite(it.id)}
                  className="absolute right-3 top-3 z-10 rounded-full bg-cream/80 p-1.5 text-ink/70 backdrop-blur-sm hover:text-cta"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
                <Link href={`/product/${it.slug}`} className="flex flex-1 flex-col">
                  <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-surface">
                    {it.image && (
                      <Image src={it.image} alt={it.name} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                    )}
                  </div>
                  <div className="pt-4">
                    {it.factory && <span className="text-xs uppercase tracking-wider text-muted">{it.factory}</span>}
                    <h3 className="mt-1 font-serif text-lg text-ink">{it.name}</h3>
                    <p className="mt-2 font-serif text-lg text-ink">{formatPriceFrom(it.priceFrom)}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
