import { getMaterials, MATERIAL_CATEGORY_LABELS, assetDownloadUrl } from "@/lib/cabinet";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER = ["price", "drawings", "textures", "terms", "marketing"];

export default async function MaterialsPage() {
  const materials = await getMaterials();

  const groups = CATEGORY_ORDER.map((cat) => ({
    cat,
    label: MATERIAL_CATEGORY_LABELS[cat] ?? cat,
    items: materials.filter((m) => m.category === cat),
  })).filter((g) => g.items.length > 0);

  const ungrouped = materials.filter((m) => !m.category || !CATEGORY_ORDER.includes(m.category));
  if (ungrouped.length) groups.push({ cat: "other", label: "Прочее", items: ungrouped });

  return (
    <div>
      <h1 className="text-3xl">Материалы</h1>
      <p className="mt-2 text-muted">Рабочие материалы для партнёров: прайсы, чертежи, фактуры и условия.</p>

      {groups.length === 0 ? (
        <p className="mt-8 rounded-[var(--radius-card)] border border-dashed border-line p-6 text-muted">
          Материалы пока не добавлены.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {groups.map((g) => (
            <section key={g.cat}>
              <h2 className="text-xl">{g.label}</h2>
              <span className="mt-2 block h-px w-12 bg-terracotta" />
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {g.items.map((m) => {
                  const href = m.url || (m.file ? assetDownloadUrl(m.file) : null);
                  return (
                    <li key={m.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
                      <h3 className="font-serif text-lg text-ink">{m.title}</h3>
                      {m.description && <p className="mt-1 text-sm text-muted">{m.description}</p>}
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block text-sm text-terracotta underline underline-offset-2 hover:text-cta"
                        >
                          {m.url ? "Открыть ссылку" : "Скачать файл"}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
