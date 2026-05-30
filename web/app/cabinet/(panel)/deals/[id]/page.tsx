import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CommissionBadge, StatusTimeline } from "@/components/cabinet/DealBits";
import { cabinetFileUrl, getMyDeal } from "@/lib/cabinet";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealId = Number(id);
  if (!Number.isFinite(dealId)) notFound();

  const deal = await getMyDeal(dealId);
  if (!deal) notFound(); // чужая или несуществующая сделка

  const attachments = (deal.attachments ?? []).map((a) => a.directus_files_id).filter(Boolean);

  return (
    <div className="max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Кабинет", href: "/cabinet" },
          { label: "Сделки", href: "/cabinet/deals" },
          { label: `№ ${deal.number ?? deal.id}` },
        ]}
      />

      <h1 className="mt-4 text-3xl">{deal.title}</h1>
      <p className="mt-1 text-muted">
        № {deal.number ?? deal.id}
        {deal.client_object ? ` · ${deal.client_object}` : ""}
      </p>

      <section className="mt-8 rounded-[var(--radius-card)] border border-line bg-surface p-6">
        <h2 className="mb-4 text-lg">Статус заказа</h2>
        <StatusTimeline status={deal.status} />
      </section>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
          <h2 className="text-lg">Сумма и состав</h2>
          {deal.amount != null && <p className="mt-2 font-serif text-2xl text-ink">{formatPrice(deal.amount)}</p>}
          {deal.items && <p className="mt-2 whitespace-pre-line text-sm text-muted">{deal.items}</p>}
        </section>

        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
          <h2 className="text-lg">Вознаграждение</h2>
          {deal.commission_amount != null ? (
            <>
              <p className="mt-2 font-serif text-2xl text-ink">{formatPrice(deal.commission_amount)}</p>
              <div className="mt-2">
                <CommissionBadge status={deal.commission_status} />
              </div>
            </>
          ) : (
            <p className="mt-2 text-muted">—</p>
          )}
        </section>
      </div>

      {deal.comment && (
        <section className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-6">
          <h2 className="text-lg">Комментарий</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-ink/90">{deal.comment}</p>
        </section>
      )}

      {attachments.length > 0 && (
        <section className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-6">
          <h2 className="text-lg">Вложения</h2>
          <ul className="mt-3 space-y-2">
            {attachments.map((f) => (
              <li key={f.id}>
                <a
                  href={cabinetFileUrl(f.id)}
                  className="text-sm text-terracotta underline underline-offset-2 hover:text-cta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {f.title || f.filename_download || "Файл"}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted">
        <span>Создана: {fmtDate(deal.created_at)}</span>
        <span>Обновлена: {fmtDate(deal.updated_at)}</span>
      </div>

      <Link href="/cabinet/deals" className="mt-8 inline-block text-sm text-terracotta hover:underline">
        ← Ко всем сделкам
      </Link>
    </div>
  );
}
