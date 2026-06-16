"use client";

import { useState } from "react";
import Image from "next/image";

interface Scene {
  id: number;
  title: string;
  image: string | null;
  hotspots: { id: number; pos_x: number; pos_y: number; product: { name: string } | null }[];
}

/** Утилита подбора координат для «Shop the look»: клик по фото → pos_x / pos_y.
 *  Геометрия (aspect-16/9 + object-cover) совпадает с фронтом, чтобы маркеры
 *  встали туда же. Запись не делается — числа копируются в Directus вручную. */
export function HotspotPicker({ scenes }: { scenes: Scene[] }) {
  const [idx, setIdx] = useState(0);
  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);

  if (scenes.length === 0) {
    return <p className="text-muted">Сначала создайте сцену (Showcase Scenes) с изображением и статусом «Опубликовано».</p>;
  }
  const scene = scenes[idx];

  const onPick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    const x = clamp(((e.clientX - r.left) / r.width) * 100);
    const y = clamp(((e.clientY - r.top) / r.height) * 100);
    setPt({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    setCopied(false);
  };

  const copy = () => {
    if (!pt) return;
    navigator.clipboard?.writeText(`${pt.x}\t${pt.y}`).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  return (
    <div className="max-w-3xl">
      <label className="block text-sm text-muted" htmlFor="scene">Сцена</label>
      <select
        id="scene"
        value={idx}
        onChange={(e) => {
          setIdx(Number(e.target.value));
          setPt(null);
          setCopied(false);
        }}
        className="mt-1 w-full rounded-[var(--radius-card)] border border-line bg-surface px-3 py-2 text-ink"
      >
        {scenes.map((s, i) => (
          <option key={s.id} value={i}>
            {s.title}
          </option>
        ))}
      </select>

      <div
        onClick={onPick}
        className="relative mt-4 aspect-[16/9] w-full cursor-crosshair select-none overflow-hidden rounded-[var(--radius-card)] bg-ink/5"
      >
        {scene.image && (
          <Image src={scene.image} alt={scene.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" draggable={false} />
        )}

        {/* существующие маркеры — для ориентира */}
        {scene.hotspots.map((h) => (
          <span
            key={h.id}
            title={h.product?.name ?? `${h.pos_x}, ${h.pos_y}`}
            style={{ left: `${h.pos_x}%`, top: `${h.pos_y}%` }}
            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cream bg-ink/50"
          />
        ))}

        {/* новая точка */}
        {pt && (
          <span
            style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
            className="pointer-events-none absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          >
            <span className="absolute inline-flex h-full w-full rounded-full bg-cta/40 motion-safe:animate-ping" />
            <span className="relative h-4 w-4 rounded-full border-2 border-cta bg-cream shadow" />
          </span>
        )}
      </div>

      {pt ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <span className="font-serif text-lg text-ink">
            pos_x = <b>{pt.x}</b> &nbsp;·&nbsp; pos_y = <b>{pt.y}</b>
          </span>
          <button
            type="button"
            onClick={copy}
            className="rounded-[var(--radius-card)] border border-line px-3 py-1.5 text-sm text-ink transition-colors hover:border-terracotta hover:text-terracotta"
          >
            {copied ? "Скопировано ✓" : "Копировать (таб между числами)"}
          </button>
          <span className="w-full text-sm text-muted">
            Впишите эти числа в поля <b>pos_x</b> / <b>pos_y</b> у Showcase Hotspot (сцена «{scene.title}», + выбрать товар).
          </span>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Кликните по фото в точке, где должен стоять маркер товара.</p>
      )}
    </div>
  );
}
