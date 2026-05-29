"use client";

import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { type FavItem, toggleFavorite, useIsFavorite } from "@/lib/favorites";

export function FavoriteButton({
  item,
  className,
  size = "md",
}: {
  item: FavItem;
  className?: string;
  size?: "md" | "lg";
}) {
  const fav = useIsFavorite(item.id);

  return (
    <button
      type="button"
      aria-label={fav ? "Убрать из избранного" : "В избранное"}
      aria-pressed={fav}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(item);
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors",
        fav ? "text-cta" : "text-ink/60 hover:text-cta",
        className,
      )}
    >
      <HeartIcon filled={fav} className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
    </button>
  );
}
