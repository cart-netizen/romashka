"use client";

import { useState } from "react";

export interface Swatch {
  id: number;
  name: string;
  hex: string | null;
  image: string | null;
}

export function FabricSwatches({ swatches }: { swatches: Swatch[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (swatches.length === 0) return null;
  const active = hovered != null ? swatches[hovered] : null;

  return (
    <div className="relative">
      {/* Крупное превью слева от свотчей (на десктопе, по наведению) */}
      {active && (
        <div className="pointer-events-none absolute right-full top-0 z-20 mr-4 hidden w-52 lg:block">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-soft)]">
            <div
              className="aspect-square w-full bg-cover bg-center"
              style={active.image ? { backgroundImage: `url(${active.image})` } : { backgroundColor: active.hex ?? "transparent" }}
            />
            <p className="px-3 py-2 text-sm text-ink">
              Цвет обивки: <span className="text-muted">{active.name}</span>
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {swatches.map((s, i) => (
          <button
            key={s.id}
            type="button"
            title={s.name}
            aria-label={`Цвет обивки: ${s.name}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            className="h-12 w-12 overflow-hidden rounded-[var(--radius-card)] border border-line bg-cover bg-center transition-transform hover:scale-105 hover:border-ink"
            style={s.image ? { backgroundImage: `url(${s.image})` } : { backgroundColor: s.hex ?? "transparent" }}
          />
        ))}
      </div>

      {/* На мобильных превью названия под свотчами */}
      {active && (
        <p className="mt-2 text-sm text-ink lg:hidden">
          Цвет обивки: <span className="text-muted">{active.name}</span>
        </p>
      )}
    </div>
  );
}
