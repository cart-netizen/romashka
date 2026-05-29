"use client";

import { cn } from "@/lib/cn";

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  format = (v) => String(v),
}: {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  format?: (v: number) => string;
}) {
  const [lo, hi] = value;
  const span = Math.max(1, max - min);
  const pct = (v: number) => ((v - min) / span) * 100;

  if (max <= min) return null;

  return (
    <div>
      <div className="dual-range relative h-4">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-terracotta"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label="Минимум"
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label="Максимум"
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
        />
      </div>
      <div className={cn("mt-2 flex justify-between text-xs text-muted")}>
        <span>{format(lo)}</span>
        <span>{format(hi)}</span>
      </div>
    </div>
  );
}
