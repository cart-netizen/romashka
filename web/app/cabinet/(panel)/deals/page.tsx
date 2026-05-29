import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { CommissionBadge, StatusBadge } from "@/components/cabinet/DealBits";
import { getMyDeals } from "@/lib/cabinet";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const deals = await getMyDeals();

  return (
    <div>
      <h1 className="text-3xl">Мои сделки</h1>
      <p className="mt-2 text-muted">Статусы заказов и агентского вознаграждения. Только просмотр.</p>

      {deals.length === 0 ? (
        <p className="mt-8 rounded-[var(--radius-card)] border border-dashed border-line p-6 text-muted">
          Пока нет сделок.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {deals.map((d) => (
            <li key={d.id}>
              <Link
                href={`/cabinet/deals/${d.id}`}
                className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-colors hover:border-terracotta sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="text-xs text-muted">№ {d.number ?? d.id}</span>
                  <p className="font-serif text-lg text-ink">{d.title}</p>
                  {d.client_object && <p className="text-sm text-muted">{d.client_object}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {d.amount != null && <span className="text-sm text-ink">{formatPrice(d.amount)}</span>}
                  <StatusBadge status={d.status} />
                  {d.commission_amount != null && (
                    <span className="flex items-center gap-2 text-sm text-muted">
                      Вознагр.: {formatPrice(d.commission_amount)}
                      <CommissionBadge status={d.commission_status} />
                    </span>
                  )}
                  <ArrowRightIcon className="hidden h-4 w-4 text-muted sm:block" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
