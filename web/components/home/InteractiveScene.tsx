"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatPriceFrom } from "@/lib/format";

export interface SceneData {
  id: number;
  title: string;
  image: string | null;
  hotspots: {
    id: number;
    pos_x: number;
    pos_y: number;
    product: { name: string; slug: string; price_from: number | null } | null;
  }[];
}

export function InteractiveScene({ scenes }: { scenes: SceneData[] }) {
  const [active, setActive] = useState(0);
  if (scenes.length === 0) return null;
  const scene = scenes[active] ?? scenes[0];

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-card)] bg-ink/5 sm:aspect-[16/9]">
        {scene.image && <Image src={scene.image} alt={scene.title} fill priority sizes="(max-width: 1320px) 100vw, 1320px" className="object-cover" />}
        {scene.hotspots.map((h) => (
          <Hotspot key={h.id} hotspot={h} />
        ))}
      </div>

      {scenes.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {scenes.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Сцена: ${s.title}`}
              aria-pressed={i === active}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border bg-ink/5 transition",
                i === active ? "border-terracotta ring-1 ring-terracotta" : "border-line hover:border-ink/40",
              )}
            >
              {s.image && <Image src={s.image} alt="" fill sizes="120px" className="object-cover" />}
              {s.hotspots.map((h) => (
                <span
                  key={h.id}
                  className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream shadow"
                  style={{ left: `${h.pos_x}%`, top: `${h.pos_y}%` }}
                />
              ))}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Hotspot({ hotspot }: { hotspot: SceneData["hotspots"][number] }) {
  const p = hotspot.product;
  if (!p) return null;
  return (
    <Link
      href={`/product/${p.slug}`}
      aria-label={`${p.name} — ${formatPriceFrom(p.price_from)}`}
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${hotspot.pos_x}%`, top: `${hotspot.pos_y}%` }}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full bg-cream/70 motion-safe:animate-ping" />
        <span className="relative h-4 w-4 rounded-full border-2 border-cta bg-cream" />
      </span>

      <span className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-max max-w-56 -translate-x-1/2 rounded-[var(--radius-card)] bg-cream p-3 text-left opacity-0 shadow-[var(--shadow-soft)] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="block font-serif text-sm text-ink">{p.name}</span>
        <span className="mt-1 flex items-center gap-1.5 text-sm text-terracotta">
          {formatPriceFrom(p.price_from)}
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </span>
      </span>
    </Link>
  );
}
