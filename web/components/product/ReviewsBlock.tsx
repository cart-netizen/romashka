import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Review } from "@/lib/directus.types";
import { reviewsLabel } from "@/lib/format";
import { Rating } from "./Rating";

export function ReviewsBlock({ reviews, average }: { reviews: Review[]; average: number }) {
  return (
    <section id="reviews" className="scroll-mt-24 bg-surface">
      <Container className="py-16">
        <SectionHeading title="Отзывы" />

        {reviews.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-[var(--radius-card)] border border-dashed border-line py-12 text-center">
            <p className="text-lg text-ink">Пока нет отзывов…</p>
            <p className="mt-2 text-sm text-muted">
              Будьте первыми — поделитесь впечатлением о товаре при визите в салон, и мы опубликуем ваш отзыв.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Rating value={average} />
              <span className="text-lg text-ink">{average.toFixed(1).replace(".", ",")}</span>
              <span className="text-sm text-muted">· {reviewsLabel(reviews.length)}</span>
            </div>

            <ul className="mx-auto mt-10 max-w-2xl space-y-6">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-[var(--radius-card)] border border-line bg-cream p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-ink">{r.author_name ?? "Покупатель"}</span>
                    {r.rating != null && <Rating value={r.rating} />}
                  </div>
                  {r.text && <p className="mt-3 text-sm leading-relaxed text-ink/90">{r.text}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </Container>
    </section>
  );
}
