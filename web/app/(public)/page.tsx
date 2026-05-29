import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRightIcon, StoreIcon, ToolIcon, TruckIcon } from "@/components/ui/icons";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { assetUrl, getCategories, getFactories, getProducts, getSiteSettings } from "@/lib/directus";

export const revalidate = 120;

export default async function HomePage() {
  const [settings, categories, products, factories] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getProducts({ limit: 8 }),
    getFactories(),
  ]);

  const heroImage = assetUrl(categories[0]?.hero_image, { width: 1920, height: 1100, fit: "cover" });

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[68vh] items-center">
        {heroImage && (
          <Image src={heroImage} alt="" fill priority sizes="100vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/45 to-ink/20" />
        <Container className="relative py-20">
          <p className="text-sm uppercase tracking-[0.3em] text-cream/80">ООО «Ромашка» · Барнаул</p>
          <h1 className="mt-5 max-w-2xl text-4xl text-cream sm:text-5xl lg:text-6xl">
            {settings.hero_title ?? "Премиальная мебель для вашего дома"}
          </h1>
          {settings.hero_subtitle && (
            <p className="mt-6 max-w-xl text-lg text-cream/85">{settings.hero_subtitle}</p>
          )}
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/catalog" size="lg">
              Смотреть каталог
            </ButtonLink>
            <ButtonLink href="/contacts" size="lg" variant="outline" className="border-cream/40 text-cream hover:bg-cream/10">
              Связаться с салоном
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Категории */}
      <Container className="py-20">
        <SectionHeading title="Категории" subtitle="Подберите мебель под свой интерьер" />
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {categories.map((c) => {
            const img = assetUrl(c.hero_image, { width: 600, height: 700, fit: "cover" });
            return (
              <Link
                key={c.id}
                href={`/catalog/${c.slug}`}
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[var(--radius-card)] bg-ink/5"
              >
                {img && (
                  <Image
                    src={img}
                    alt={c.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <span className="relative z-10 flex items-center justify-between p-5 font-serif text-xl text-cream">
                  {c.name}
                  <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>

      {/* Бордовый акцент-баннер */}
      <section className="bg-burgundy">
        <Container className="flex flex-col items-center gap-5 py-16 text-center text-cream">
          <h2 className="max-w-2xl text-3xl text-cream sm:text-4xl">
            Дополните интерьер мебелью, которую выбирают сердцем
          </h2>
          <p className="max-w-xl text-cream/80">
            Поможем подобрать модель, обивку и размер под ваш проект. Образцы тканей — с доставкой.
          </p>
          <ButtonLink href="/catalog" size="lg" className="bg-cream text-burgundy hover:bg-cream/90">
            Выбрать мебель
          </ButtonLink>
        </Container>
      </section>

      {/* Популярные модели */}
      <Container className="py-20">
        <SectionHeading title="Популярные модели" subtitle="Избранные позиции из нашего каталога" />
        <div className="mt-10">
          <ProductGrid products={products} />
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/catalog" variant="outline">
            Весь каталог
          </ButtonLink>
        </div>
      </Container>

      {/* Фабрики */}
      {factories.length > 0 && (
        <section className="bg-surface">
          <Container className="py-20">
            <SectionHeading title="Наши фабрики" subtitle="Работаем напрямую с проверенными производителями" />
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {factories.map((f) => (
                <Link
                  key={f.id}
                  href={`/factories/${f.slug}`}
                  className="flex items-center justify-center rounded-[var(--radius-card)] border border-line bg-cream px-6 py-10 text-center font-serif text-lg text-ink transition-colors hover:border-terracotta hover:text-terracotta"
                >
                  {f.name}
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Доставка — терракотовый баннер */}
      <section className="bg-terracotta text-cream">
        <Container className="grid gap-10 py-16 sm:grid-cols-3">
          {[
            { Icon: StoreIcon, title: "Самовывоз", text: "Из салона в Барнауле — бесплатно." },
            { Icon: TruckIcon, title: "Доставка по Сибири", text: "Аккуратно привезём в оговорённый срок." },
            { Icon: ToolIcon, title: "Сборка мебели", text: "Профессионально соберём на месте." },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <Icon className="h-9 w-9" />
              <h3 className="mt-4 text-xl text-cream">{title}</h3>
              <p className="mt-2 text-sm text-cream/85">{text}</p>
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
