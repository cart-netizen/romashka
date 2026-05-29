import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { StoreIcon, ToolIcon, TruckIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Доставка и условия",
  description: "Самовывоз, доставка и сборка мебели по Барнаулу, Алтайскому краю и регионам Сибири.",
};

const OPTIONS = [
  { Icon: StoreIcon, title: "Самовывоз", text: "Заберите заказ из салона в Барнауле — бесплатно и в удобное время." },
  { Icon: TruckIcon, title: "Доставка по Сибири", text: "Доставляем по Алтайскому краю, Республике Алтай, Новосибирской области и другим регионам Сибири. Стоимость и сроки — по согласованию." },
  { Icon: ToolIcon, title: "Сборка мебели", text: "Профессионально соберём и установим мебель на месте, проверим качество." },
];

export default function DeliveryPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Главная", href: "/" }, { label: "Доставка и условия" }]}
        title="Доставка и условия"
        description="Привозим и собираем мебель по всей Сибири. Ниже — основные варианты получения заказа."
      />
      <Container className="py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {OPTIONS.map(({ Icon, title, text }) => (
            <div key={title} className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
              <Icon className="h-9 w-9 text-terracotta" />
              <h2 className="mt-4 font-serif text-xl text-ink">{title}</h2>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted">
          Точные сроки изготовления и доставки зависят от модели и комплектации — менеджер уточнит их при оформлении обращения.
        </p>
      </Container>
    </>
  );
}
