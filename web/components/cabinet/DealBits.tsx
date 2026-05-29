import { cn } from "@/lib/cn";
import { COMMISSION_STATUS_LABELS, DEAL_STATUS_FLOW, DEAL_STATUS_LABELS } from "@/lib/cabinet";

export function StatusBadge({ status }: { status: string }) {
  const closed = status === "closed";
  return (
    <span
      className={cn(
        "inline-block rounded-full px-3 py-1 text-xs font-medium",
        closed ? "bg-ink/10 text-ink/70" : "bg-terracotta/15 text-terracotta",
      )}
    >
      {DEAL_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function CommissionBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const tone =
    status === "paid"
      ? "bg-[#2f5d50]/15 text-[#2f5d50]"
      : status === "ready_to_pay"
        ? "bg-cta/15 text-cta"
        : "bg-ink/10 text-ink/70";
  return (
    <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-medium", tone)}>
      {COMMISSION_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function StatusTimeline({ status }: { status: string }) {
  const currentIndex = DEAL_STATUS_FLOW.indexOf(status as (typeof DEAL_STATUS_FLOW)[number]);
  return (
    <ol className="flex flex-wrap gap-x-2 gap-y-3">
      {DEAL_STATUS_FLOW.map((s, i) => {
        const done = i <= currentIndex && currentIndex >= 0;
        const current = i === currentIndex;
        return (
          <li key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                current ? "bg-terracotta text-cream" : done ? "bg-terracotta/30 text-terracotta" : "bg-ink/10 text-ink/50",
              )}
            >
              {i + 1}
            </span>
            <span className={cn("text-sm", current ? "text-ink" : "text-muted")}>{DEAL_STATUS_LABELS[s]}</span>
            {i < DEAL_STATUS_FLOW.length - 1 && <span className="ml-1 hidden text-line sm:inline">—</span>}
          </li>
        );
      })}
    </ol>
  );
}
