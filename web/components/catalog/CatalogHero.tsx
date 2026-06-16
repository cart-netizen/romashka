import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";

/**
 * Узкий hero-баннер каталога: фото на фоне + затемнение + центрированные
 * заголовок и описание (как на референсе). Фото/название/описание берутся из
 * категории в админке (hero_image / name / description). Без фото — бордовый фон.
 */
export function CatalogHero({
  crumbs,
  title,
  description,
  image,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  description?: string | null;
  image?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-surface">
      <Container className="pt-5">
        <Breadcrumbs items={crumbs} />
      </Container>

      <div className="relative mt-4 h-[200px] w-full overflow-hidden bg-burgundy sm:h-[240px] lg:h-[280px]">
        {image && (
          <Image src={image} alt="" fill priority sizes="100vw" className="object-cover object-center" />
        )}
        <div className="absolute inset-0 bg-ink/45" />
        <Container className="relative flex h-full flex-col items-center justify-center text-center">
          <h1 className="text-3xl text-cream sm:text-4xl">{title}</h1>
          {description && (
            <p className="mt-4 line-clamp-3 max-w-2xl text-sm font-semibold leading-relaxed text-cream/85 sm:text-base">
              {description}
            </p>
          )}
        </Container>
      </div>

      {children && <Container className="py-5">{children}</Container>}
    </div>
  );
}
