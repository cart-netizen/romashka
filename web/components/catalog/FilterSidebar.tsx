"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { CheckboxGroup, ColorSwatchGroup, Toggle, type Option } from "@/components/ui/FilterControls";
import type { CatalogFacets } from "@/lib/directus";
import { FRAME_LABELS, UPHOLSTERY_LABELS } from "@/lib/directus.types";
import { buildCatalogParams, type CatalogQuery } from "@/lib/catalog-params";

const FRAME_OPTIONS: Option[] = Object.entries(FRAME_LABELS).map(([value, label]) => ({ value, label }));
const UPHOLSTERY_OPTIONS: Option[] = Object.entries(UPHOLSTERY_LABELS).map(([value, label]) => ({ value, label }));

interface DraftState {
  inStock: boolean;
  factories: string[];
  frame: string[];
  upholstery: string[];
  colors: number[];
  price: [number, number];
  width: [number, number];
  height: [number, number];
  depth: [number, number];
}

function rub(v: number) {
  return `${new Intl.NumberFormat("ru-RU").format(v)} ₽`;
}
const cm = (v: number) => `${v} см`;

export function FilterSidebar({
  basePath,
  query,
  facets,
  onApplied,
}: {
  basePath: string;
  query: CatalogQuery;
  facets: CatalogFacets;
  onApplied?: () => void;
}) {
  const router = useRouter();

  const init: DraftState = {
    inStock: query.inStock,
    factories: query.factories,
    frame: query.frame,
    upholstery: query.upholstery,
    colors: query.colors,
    price: [query.priceMin ?? facets.priceMin, query.priceMax ?? facets.priceMax],
    width: [query.widthMin ?? 0, query.widthMax ?? facets.widthMax],
    height: [query.heightMin ?? 0, query.heightMax ?? facets.heightMax],
    depth: [query.depthMin ?? 0, query.depthMax ?? facets.depthMax],
  };
  const [draft, setDraft] = useState<DraftState>(init);

  const toggle = <T,>(arr: T[], v: T): T[] => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const apply = () => {
    const params = buildCatalogParams({
      q: query.q,
      sort: query.sort,
      inStock: draft.inStock,
      factories: draft.factories,
      frame: draft.frame,
      upholstery: draft.upholstery,
      colors: draft.colors,
      priceMin: draft.price[0] > facets.priceMin ? draft.price[0] : undefined,
      priceMax: draft.price[1] < facets.priceMax ? draft.price[1] : undefined,
      widthMin: draft.width[0] > 0 ? draft.width[0] : undefined,
      widthMax: draft.width[1] < facets.widthMax ? draft.width[1] : undefined,
      heightMin: draft.height[0] > 0 ? draft.height[0] : undefined,
      heightMax: draft.height[1] < facets.heightMax ? draft.height[1] : undefined,
      depthMin: draft.depth[0] > 0 ? draft.depth[0] : undefined,
      depthMax: draft.depth[1] < facets.depthMax ? draft.depth[1] : undefined,
    });
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
    onApplied?.();
  };

  const reset = () => {
    const params = buildCatalogParams({ q: query.q, sort: query.sort });
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
    onApplied?.();
  };

  return (
    <div className="space-y-6">
      <Toggle checked={draft.inStock} onChange={(v) => setDraft({ ...draft, inStock: v })} label="Только в наличии" />

      {facets.factories.length > 0 && (
        <Section title="Фабрика">
          <CheckboxGroup
            options={facets.factories.map((f) => ({ value: f.slug, label: f.name }))}
            selected={draft.factories}
            onToggle={(v) => setDraft({ ...draft, factories: toggle(draft.factories, v) })}
          />
        </Section>
      )}

      <Section title="Каркас">
        <CheckboxGroup
          options={FRAME_OPTIONS}
          selected={draft.frame}
          onToggle={(v) => setDraft({ ...draft, frame: toggle(draft.frame, v) })}
        />
      </Section>

      <Section title="Обивка">
        <CheckboxGroup
          options={UPHOLSTERY_OPTIONS}
          selected={draft.upholstery}
          onToggle={(v) => setDraft({ ...draft, upholstery: toggle(draft.upholstery, v) })}
        />
      </Section>

      {facets.priceMax > facets.priceMin && (
        <Section title="Цена">
          <RangeSlider
            min={facets.priceMin}
            max={facets.priceMax}
            step={1000}
            value={draft.price}
            onChange={(v) => setDraft({ ...draft, price: v })}
            format={rub}
          />
        </Section>
      )}

      {facets.colors.length > 0 && (
        <Section title="Цвета">
          <ColorSwatchGroup
            options={facets.colors}
            selected={draft.colors}
            onToggle={(id) => setDraft({ ...draft, colors: toggle(draft.colors, id) })}
          />
        </Section>
      )}

      {(facets.widthMax > 0 || facets.heightMax > 0 || facets.depthMax > 0) && (
        <Section title="Размеры, см">
          <div className="space-y-5">
            {facets.widthMax > 0 && (
              <Dim label="Ширина" max={facets.widthMax} value={draft.width} onChange={(v) => setDraft({ ...draft, width: v })} />
            )}
            {facets.heightMax > 0 && (
              <Dim label="Высота" max={facets.heightMax} value={draft.height} onChange={(v) => setDraft({ ...draft, height: v })} />
            )}
            {facets.depthMax > 0 && (
              <Dim label="Глубина" max={facets.depthMax} value={draft.depth} onChange={(v) => setDraft({ ...draft, depth: v })} />
            )}
          </div>
        </Section>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="cta" size="sm" fullWidth onClick={apply}>
          Применить
        </Button>
        <Button variant="outline" size="sm" fullWidth onClick={reset}>
          Сбросить
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink">{title}</h3>
      {children}
    </div>
  );
}

function Dim({
  label,
  max,
  value,
  onChange,
}: {
  label: string;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted">{label}</p>
      <RangeSlider min={0} max={max} step={1} value={value} onChange={onChange} format={cm} />
    </div>
  );
}
