import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  BankIcon,
  CardIcon,
  ShieldIcon,
  StoreIcon,
  SwatchIcon,
  ToolIcon,
  TruckIcon,
} from "@/components/ui/icons";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { BestsellerStrip } from "@/components/catalog/BestsellerStrip";
import { InteractiveScene, type SceneData } from "@/components/home/InteractiveScene";
import { HeroVideo } from "@/components/home/HeroVideo";
import { Timeline } from "@/components/home/Timeline";
import { DeliveryCarousel } from "@/components/home/DeliveryCarousel";
import {
  assetUrl,
  getCategories,
  getFactories,
  getProducts,
  getShowcaseScenes,
  getSiteSettings,
} from "@/lib/directus";

export const revalidate = 120;

export const metadata: Metadata = {
  description:
    "Премиальная мебель в Барнауле: диваны, кровати, кресла, тумбочки от фабрик-партнёров. Подбор, доставка и сборка по Сибири. Цена «от ___ ₽».",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "Мебельный салон «Ромашка» — премиальная мебель в Барнауле",
  },
};

export default async function HomePage() {
  const [settings, categories, scenesRaw, bestsellers, newest, latest, factories] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getShowcaseScenes(),
    getProducts({ isBestseller: true, limit: 8 }),
    getProducts({ isNew: true, limit: 8 }),
    getProducts({ limit: 8 }),
    getFactories(),
  ]);

  const heroImage = assetUrl(categories[0]?.hero_image, { width: 1920, height: 1100, fit: "cover" });
  const heroVideo = assetUrl(settings.hero_video); // без трансформаций — отдаём видео как есть
  const timeline = settings.timeline ?? [];
  const aboutImage =
    assetUrl(settings.about_image, { width: 1000, height: 820, fit: "cover" }) ??
    assetUrl(scenesRaw[0]?.image, { width: 1000, height: 820, fit: "cover" }) ??
    assetUrl(categories[1]?.hero_image ?? categories[0]?.hero_image, { width: 1000, height: 820, fit: "cover" });
  const deliveryParagraphs = [
    "Мы сделаем всё возможное, чтобы доставка вашей мебели прошла гладко и без стресса. Наш опытный персонал обеспечит аккуратную транспортировку, поможет поднять покупку на этаж и, если потребуется, профессионально соберёт её.",
    "При доставке наши специалисты внимательно осматривают каждую деталь, чтобы убедиться в отсутствии дефектов и сохранить идеальное качество. Если потребуется, мы поможем установить мебель на место и убедимся, что всё выглядит безукоризненно.",
    "Наши сборщики работают аккуратно и с уважением к вашему дому. Все элементы подгоняются точно, крепления проверяются, а пространство остаётся чистым и опрятным. Ваша мебель сразу готова к использованию — красиво, надёжно и без лишних хлопот.",
  ];
  const scenes: SceneData[] = scenesRaw.map((s) => ({
    id: s.id,
    title: s.title,
    image: assetUrl(s.image, { width: 1600, height: 900, fit: "cover" }),
    hotspots: s.hotspots,
  }));
  const hits = bestsellers.length > 0 ? bestsellers : latest;

  return (
    <>
      {/* Hero — фиксированная высота, фото/видео заполняют по ширине с обрезкой сверху/снизу */}
      <section className="relative flex h-[clamp(460px,70vh,760px)] items-center overflow-hidden">
        {/* Базовый слой — изображение (на мобильных всегда оно) */}
        {heroImage && <Image src={heroImage} alt="" fill priority sizes="100vw" className="object-cover" />}
        {/* Видео — только на десктопе (на мобильных не загружается) */}
        {heroVideo && <HeroVideo src={heroVideo} poster={heroImage ?? undefined} />}
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/45 to-ink/20" />
        <Container className="relative py-20">
          <p className="text-sm uppercase tracking-[0.3em] text-cream/80">ООО «Ромашка» · Барнаул</p>
          <h1 className="mt-5 max-w-2xl text-4xl text-cream sm:text-5xl lg:text-6xl">
            {settings.hero_title ?? "Премиальная мебель для вашего дома"}
          </h1>
          {settings.hero_subtitle && <p className="mt-6 max-w-xl text-lg text-cream/85">{settings.hero_subtitle}</p>}
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

      {/* Категории — как на референсе: слева текст + кнопка, справа карточки-слайдер */}
      <Container className="py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.3fr] lg:gap-14">
          {/* Левая часть — текст и кнопка */}
          <div className="max-w-md">
            <p className="font-serif text-lg leading-relaxed text-ink sm:text-xl">
              Дом — это сердце каждой встречи. Создавайте пространство для смеха, трапез и воспоминаний,
              используя мебель, которая делает встречи непринуждёнными.
            </p>
            <Link
              href="/catalog"
              className="mt-8 inline-flex h-[50px] items-center justify-center rounded-[10px] border border-ink px-7 font-serif text-base font-medium text-ink transition-colors hover:bg-burgundy hover:text-cream sm:text-lg"
            >
              Выбрать мебель
            </Link>
          </div>

          {/* Правая часть — горизонтальный слайдер карточек-категорий */}
          <div className="-mx-4 min-w-0 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:px-0">
            <div className="flex snap-x gap-5">
              {categories.map((c) => {
                const img = assetUrl(c.hero_image, { width: 720, height: 960, fit: "cover" });
                return (
                  <Link
                    key={c.id}
                    href={`/catalog/${c.slug}`}
                    className="group relative block aspect-[3/4] w-[74vw] max-w-[360px] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)] bg-ink/5 sm:w-[360px]"
                  >
                    {img && (
                      <Image src={img} alt={c.name} fill sizes="360px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent" />
                    <span className="absolute bottom-5 left-5 rounded-[10px] bg-cream px-5 py-2.5 font-serif text-sm font-medium text-ink shadow-sm transition-colors group-hover:bg-terracotta group-hover:text-cream">
                      {c.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </Container>

      {/* Shop the look */}
      {scenes.length > 0 && (
        <section className="bg-surface">
          <Container className="py-20">
            <SectionHeading title="Соберите интерьер" subtitle="Наведите на отмеченные предметы — и перейдите к понравившейся модели" />
            <div className="mt-10">
              <InteractiveScene scenes={scenes} />
            </div>
          </Container>
        </section>
      )}

      {/* Ещё больше причин влюбиться — бестселлеры (по референсу) */}
      {hits.length > 0 && (
        <Container className="py-20">
          <div className="flex flex-col items-center gap-6 text-center">
            <h2 className="text-3xl sm:text-4xl">Ещё больше причин влюбиться</h2>
            <Link
              href="/catalog?badge=hit"
              className="inline-flex h-[50px] items-center justify-center rounded-[10px] border border-ink px-7 font-serif text-base font-medium text-ink transition-colors hover:bg-burgundy hover:text-cream sm:text-lg"
            >
              Выбрать бестселлеры
            </Link>
          </div>
          <div className="mt-12">
            <BestsellerStrip products={hits} />
          </div>
          <div className="mx-auto mt-10 h-0.5 w-40 rounded bg-terracotta/50" />
        </Container>
      )}

      {/* Бордовый акцент-баннер */}
      <section className="bg-burgundy">
        <Container className="flex flex-col items-center gap-5 py-16 text-center text-cream">
          <h2 className="max-w-2xl text-3xl text-cream sm:text-4xl">Дополните интерьер мебелью, которую выбирают сердцем</h2>
          <p className="max-w-xl text-cream/80">Поможем подобрать модель, обивку и размер под ваш проект. Образцы тканей — с доставкой.</p>
          <ButtonLink href="/catalog" size="lg" className="bg-cream text-burgundy hover:bg-cream/90">
            Выбрать мебель
          </ButtonLink>
        </Container>
      </section>

      {/* Новинки */}
      {newest.length > 0 && (
        <section className="bg-surface">
          <Container className="py-20">
            <SectionHeading title="Новинки" subtitle="Свежие поступления коллекций" />
            <div className="mt-10">
              <ProductGrid products={newest} />
            </div>
          </Container>
        </section>
      )}

      {/* Фабрики */}
      {factories.length > 0 && (
        <Container className="py-20">
          <SectionHeading title="Наши фабрики" subtitle="Работаем напрямую с проверенными производителями" />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {factories.map((f) => (
              <Link
                key={f.id}
                href={`/factories/${f.slug}`}
                className="flex items-center justify-center rounded-[var(--radius-card)] border border-line bg-surface px-6 py-10 text-center font-serif text-lg text-ink transition-colors hover:border-terracotta hover:text-terracotta"
              >
                {f.name}
              </Link>
            ))}
          </div>
        </Container>
      )}

      {/* О нас — текст слева, фото интерьера справа (общий фон) */}
      <Container className="py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl sm:text-4xl">О нас</h2>
            <p className="mt-6 max-w-xl text-muted">
              Мы — профессионалы, вдохновлённые созданием идеальной мебели для вашего дома. Сочетая стиль,
              функциональность и качество, мы стремимся сделать каждый интерьер уникальным и комфортным.
            </p>
            <p className="mt-8 font-serif text-lg text-ink">Мы предлагаем:</p>
            <ul className="mt-5 space-y-5">
              {[
                { n: 1, title: "Мягкую мебель", text: "Кресла, пуфы, диваны, стулья с мягкой обшивкой" },
                { n: 2, title: "Функциональность и стиль", text: "Стильные и практичные решения для вашего дома" },
              ].map((it) => (
                <li key={it.n} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-terracotta font-serif text-terracotta">
                    {it.n}
                  </span>
                  <div>
                    <h3 className="font-serif text-lg text-ink">{it.title}</h3>
                    <p className="mt-1 text-sm text-muted">{it.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-surface lg:aspect-[5/4]">
            {aboutImage && (
              <Image
                src={aboutImage}
                alt="Интерьер с мебелью салона «Ромашка»"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            )}
          </div>
        </div>
      </Container>

      {/* История компании — структурированный таймлайн */}
      {timeline.length > 0 && (
        <section className="bg-surface">
          <Container className="py-20">
            <SectionHeading title={settings.timeline_title ?? "История компании"} subtitle="Развиваемся с 2013 года" />
            <div className="mt-12">
              <Timeline entries={timeline} />
            </div>
          </Container>
        </section>
      )}

      {/* Доставка — заголовок слева, карусель абзацев справа (общий фон) */}
      <Container className="py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <h2 className="text-3xl sm:text-4xl">Доставка</h2>
          <DeliveryCarousel items={deliveryParagraphs} />
        </div>
      </Container>

      {/* Услуги и сервис */}
      <section className="bg-terracotta text-cream">
        <Container className="grid gap-x-8 gap-y-10 py-16 sm:grid-cols-3">
          {[
            { Icon: StoreIcon, title: "Самовывоз", text: "Из салона в Барнауле — бесплатно." },
            { Icon: TruckIcon, title: "Доставка по Сибири", text: "Аккуратно привезём в оговорённый срок." },
            { Icon: ToolIcon, title: "Сборка мебели", text: "Профессионально соберём на месте." },
            { Icon: ShieldIcon, title: "Гарантия качества", text: "Гарантия на мебель и работу по сборке." },
            { Icon: SwatchIcon, title: "Персональный подбор", text: "Образцы тканей и консультация по проекту." },
            { Icon: CardIcon, title: "Удобная оплата", text: "Наличные, карта или безналичный расчёт." },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <Icon className="h-9 w-9" />
              <h3 className="mt-4 text-xl text-cream">{title}</h3>
              <p className="mt-2 text-sm text-cream/85">{text}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Как оплатить заказ */}
      <Container className="pt-20 pb-10">
        <SectionHeading title="Как оплатить заказ?" subtitle="Оплата оформляется в салоне после согласования заказа — без онлайн-оплаты" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {[
            {
              Icon: CardIcon,
              title: "Банковская карта",
              text: "Оплата картой в салоне — за товары в наличии или в производстве (от 60 дней), после подписания договора.",
            },
            {
              Icon: BankIcon,
              title: "Безналичный расчёт (юрлица или физлица)",
              text: "Оставьте контактные данные (телефон, e-mail, ФИО) — менеджер свяжется для подтверждения заказа.",
            },
          ].map(({ Icon, title, text }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-6"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-line text-terracotta">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-serif text-lg text-ink">{title}</h3>
                <p className="mt-2 text-sm text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm text-muted">
          Возникли вопросы по оплате? Свяжитесь с нами
          {settings.phone && (
            <>
              {" "}по телефону{" "}
              <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="text-ink underline underline-offset-2 hover:text-terracotta">
                {settings.phone}
              </a>
            </>
          )}
          {settings.email && (
            <>
              {settings.phone ? " или напишите на" : " — напишите на"}{" "}
              <a href={`mailto:${settings.email}`} className="text-ink underline underline-offset-2 hover:text-terracotta">
                {settings.email}
              </a>
            </>
          )}
          . Поможем оформить заказ.
        </p>
      </Container>
    </>
  );
}
