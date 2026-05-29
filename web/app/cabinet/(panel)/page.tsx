import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { StatusBadge } from "@/components/cabinet/DealBits";
import { getMaterials, getMe, getMyDeals } from "@/lib/cabinet";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CabinetDashboard() {
  const [me, deals, materials] = await Promise.all([getMe(), getMyDeals(), getMaterials()]);
  const name = me?.first_name || "коллега";
  const active = deals.filter((d) => d.status !== "closed");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl">Здравствуйте, {name}!</h1>
        <p className="mt-2 text-muted">Здесь — статусы ваших сделок и рабочие материалы.</p>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl">Активные сделки</h2>
          <Link href="/cabinet/deals" className="inline-flex items-center gap-1.5 text-sm text-terracotta hover:underline">
            Все сделки <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        {active.length === 0 ? (
          <p className="rounded-[var(--radius-card)] border border-dashed border-line p-6 text-muted">
            Активных сделок нет.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {active.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/cabinet/deals/${d.id}`}
                  className="block rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-colors hover:border-terracotta"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted">№ {d.number ?? d.id}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="mt-2 font-serif text-lg text-ink">{d.title}</p>
                  {d.client_object && <p className="text-sm text-muted">{d.client_object}</p>}
                  {d.amount != null && <p className="mt-2 text-sm text-ink">{formatPrice(d.amount)}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl">Материалы</h2>
          <Link href="/cabinet/materials" className="inline-flex items-center gap-1.5 text-sm text-terracotta hover:underline">
            Все материалы <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-muted">Доступно материалов: {materials.length}</p>
      </section>
    </div>
  );
}
