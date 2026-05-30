import type { TimelineEntry } from "@/lib/directus.types";

/** Адаптивный вертикальный таймлайн истории компании. */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <ol className="relative mx-auto max-w-2xl border-l-2 border-line pl-6 sm:pl-8">
      {entries.map((e, i) => (
        <li key={i} className="relative pb-10 last:pb-0">
          <span className="absolute top-1.5 -left-[calc(0.375rem+1px)] h-3 w-3 rounded-full bg-terracotta ring-4 ring-cream sm:-left-[calc(0.5rem+1px)]" />
          <p className="font-serif text-2xl leading-none text-terracotta">{e.year}</p>
          {e.title && <h3 className="mt-2 font-serif text-lg text-ink">{e.title}</h3>}
          {e.text && <p className="mt-1 text-muted">{e.text}</p>}
        </li>
      ))}
    </ol>
  );
}
