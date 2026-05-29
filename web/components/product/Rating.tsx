import { StarIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function Rating({ value, className }: { value: number; className?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-terracotta", className)} aria-label={`Рейтинг ${value} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} filled={i <= rounded} className="h-4 w-4" />
      ))}
    </span>
  );
}
