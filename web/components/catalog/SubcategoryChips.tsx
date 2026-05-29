import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Subcategory } from "@/lib/directus.types";

export function SubcategoryChips({
  categorySlug,
  subcategories,
  activeSlug,
}: {
  categorySlug: string;
  subcategories: Subcategory[];
  activeSlug?: string;
}) {
  if (subcategories.length === 0) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Chip href={`/catalog/${categorySlug}`} active={!activeSlug}>
        Все
      </Chip>
      {subcategories.map((s) => (
        <Chip key={s.id} href={`/catalog/${categorySlug}/${s.slug}`} active={activeSlug === s.slug}>
          {s.name}
        </Chip>
      ))}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition-colors",
        active
          ? "border-burgundy bg-burgundy text-cream"
          : "border-line bg-cream text-ink/80 hover:border-terracotta hover:text-terracotta",
      )}
    >
      {children}
    </Link>
  );
}
