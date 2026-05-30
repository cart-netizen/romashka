"use client";

import { formatPriceFrom } from "@/lib/format";
import { useSizeVariant } from "./SizeVariantContext";

/** Цена «от» — меняется при выборе размера-варианта. */
export function VariantPrice({ basePrice }: { basePrice: number | null }) {
  const ctx = useSizeVariant();
  const current = ctx?.variants[ctx.index];
  const price = current?.price ?? basePrice;
  return <p className="mt-4 font-serif text-3xl text-ink">{formatPriceFrom(price)}</p>;
}
