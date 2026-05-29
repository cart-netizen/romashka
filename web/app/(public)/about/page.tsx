import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "О компании",
  description: "О салоне премиальной мебели «Ромашка» в Барнауле и принципах работы.",
};

const ADVANTAGES = [
  { title: "Только проверенные фабрики", text: "Работаем напрямую с производителями премиальной мебели — без посредников и переплат." },
  { title: "Подбор под интерьер", text: "Поможем выбрать модель, обивку и размер под ваш проект; отправим образцы тканей." },
  { title: "Доставка и сборка по Сибири", text: "Аккуратно доставим и профессионально соберём мебель в оговорённый срок." },
  { title: "Честная цена", text: "Стоимость — «от ___ ₽». Точную сумму менеджер рассчитает под вашу комплектацию." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Главная", href: "/" }, { label: "О компании" }]}
        title="О компании"
        description="«Ромашка» — салон премиальной мебели в Барнауле. Представляем диваны, кровати, кресла и тумбочки от фабрик-партнёров и доводим клиента до комфортного выбора."
      />
      <Container className="py-12">
        <div className="grid gap-8 sm:grid-cols-2">
          {ADVANTAGES.map((a) => (
            <div key={a.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
              <h2 className="font-serif text-xl text-ink">{a.title}</h2>
              <p className="mt-2 text-muted">{a.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-[var(--radius-card)] bg-burgundy p-10 text-center text-cream">
          <h2 className="text-2xl text-cream sm:text-3xl">Подберём мебель под ваш проект</h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/80">
            Расскажите о задаче — предложим решения из каталога и рассчитаем стоимость.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/catalog" className="bg-cream text-burgundy hover:bg-cream/90">
              Смотреть каталог
            </ButtonLink>
            <ButtonLink href="/contacts" variant="outline" className="border-cream/40 text-cream hover:bg-cream/10">
              Контакты
            </ButtonLink>
          </div>
        </div>
      </Container>
    </>
  );
}
