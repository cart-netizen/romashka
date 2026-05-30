import type { TimelineEntry } from "@/lib/directus.types";

/** Адаптивный вертикальный таймлайн истории компании. */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <ol className="mx-auto max-w-2xl">
      {entries.map((e, i) => {
        const last = i === entries.length - 1;
        return (
          <li key={i} className="flex gap-4 sm:gap-6">
            {/* Рельса: кружок + соединительная линия */}
            <div className="flex flex-col items-center">
              <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full bg-terracotta ring-4 ring-cream" />
              {!last && <span className="w-px flex-1 bg-line" />}
            </div>
            {/* Контент */}
            <div className={last ? "pb-1" : "pb-10"}>
              <p className="font-serif text-2xl leading-none text-terracotta">{e.year}</p>
              {e.title && <h3 className="mt-2 font-serif text-lg text-ink">{e.title}</h3>}
              {e.text && <p className="mt-1 text-muted">{e.text}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
