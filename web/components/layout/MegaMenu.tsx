"use client";

import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { NavCategory } from "./nav.types";

export function MegaMenu({ category, onNavigate }: { category: NavCategory; onNavigate: () => void }) {
  return (
    <div className="absolute inset-x-0 top-full z-50 border-t border-line bg-cream shadow-[var(--shadow-soft)]">
      <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_1.6fr]">
        {/* подкатегории */}
        <div>
          <h2 className="text-2xl">{category.name}</h2>
          <span className="mt-3 block h-px w-12 bg-terracotta" />
          <ul className="mt-6 space-y-3 text-sm">
            <li>
              <Link
                href={`/catalog/${category.slug}`}
                onClick={onNavigate}
                className="text-ink/80 transition-colors hover:text-terracotta"
              >
                Все {category.name.toLowerCase()}
              </Link>
            </li>
            {category.subcategories.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={`/catalog/${category.slug}/${sub.slug}`}
                  onClick={onNavigate}
                  className="text-ink/80 transition-colors hover:text-terracotta"
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* промо-плитки */}
        {category.promos.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {category.promos.map((promo) => (
              <Link
                key={promo.id}
                href={promo.link}
                onClick={onNavigate}
                className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[var(--radius-card)] bg-ink/5"
              >
                {promo.image && (
                  <Image
                    src={promo.image}
                    alt={promo.title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                <span className="relative z-10 flex items-center justify-between gap-2 p-4 text-sm font-medium text-cream">
                  {promo.title}
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
