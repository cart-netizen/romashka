export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-terracotta text-sm tracking-[0.3em] uppercase">
        ООО «Ромашка»
      </p>
      <h1 className="text-ink mt-4 max-w-2xl font-serif text-4xl leading-tight font-semibold sm:text-5xl">
        Премиальная мебель для вашего дома
      </h1>
      <p className="text-muted mt-6 max-w-xl text-base">
        Витрина в разработке. Каркас проекта готов — каталог, фабрики и личный
        кабинет дизайнеров появятся в следующих фазах.
      </p>
      <span className="bg-burgundy text-cream mt-10 inline-block rounded-full px-6 py-2 text-sm">
        Фаза 0 · подготовка
      </span>
    </main>
  );
}
