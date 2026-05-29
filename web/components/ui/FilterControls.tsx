"use client";

import { cn } from "@/lib/cn";

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", checked ? "bg-cta" : "bg-line")}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-cream shadow transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}

export interface Option {
  value: string;
  label: string;
}

export function CheckboxGroup({
  options,
  selected,
  onToggle,
}: {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {options.map((o) => {
        const checked = selected.includes(o.value);
        return (
          <li key={o.value}>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(o.value)}
                className="h-4 w-4 accent-cta"
              />
              {o.label}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export interface SwatchOption {
  id: number;
  name: string;
  hex: string | null;
}

export function ColorSwatchGroup({
  options,
  selected,
  onToggle,
}: {
  options: SwatchOption[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((c) => {
        const active = selected.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            title={c.name}
            aria-pressed={active}
            onClick={() => onToggle(c.id)}
            className={cn(
              "h-7 w-7 rounded-full border transition-all",
              active ? "border-ink ring-2 ring-cta ring-offset-1 ring-offset-cream" : "border-line",
            )}
            style={{ backgroundColor: c.hex ?? "transparent" }}
          />
        );
      })}
    </div>
  );
}
