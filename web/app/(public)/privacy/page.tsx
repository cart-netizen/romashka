import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSiteSettings } from "@/lib/directus";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Политика обработки персональных данных ООО «Ромашка» (152-ФЗ).",
};

export default async function PrivacyPage() {
  const s = await getSiteSettings();

  return (
    <>
      <PageHeader crumbs={[{ label: "Главная", href: "/" }, { label: "Политика конфиденциальности" }]} title="Политика конфиденциальности" />
      <Container className="py-12">
        <div className="mx-auto max-w-3xl space-y-6 text-ink/90">
          <p>
            Настоящая Политика определяет порядок обработки и защиты персональных данных пользователей сайта
            ООО «Ромашка» (далее — «Оператор») в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ
            «О персональных данных».
          </p>

          <Section title="1. Какие данные мы собираем">
            Имя, номер телефона, адрес электронной почты и текст сообщения — те данные, которые вы добровольно
            указываете в формах обратной связи и подписки на сайте.
          </Section>

          <Section title="2. Цели обработки">
            Обработка персональных данных осуществляется для обратной связи по вашему обращению, консультаций по
            ассортименту, информирования о предложениях (при наличии согласия) и выполнения обязательств перед вами.
          </Section>

          <Section title="3. Правовые основания">
            Обработка осуществляется на основании вашего согласия, которое вы даёте, отмечая соответствующий чекбокс
            в форме. Согласие может быть отозвано в любой момент по запросу к Оператору.
          </Section>

          <Section title="4. Хранение и защита">
            Персональные данные хранятся на серверах, расположенных на территории Российской Федерации. Оператор
            принимает необходимые правовые, организационные и технические меры для защиты данных от неправомерного
            доступа, уничтожения, изменения и распространения.
          </Section>

          <Section title="5. Передача третьим лицам">
            Оператор не передаёт персональные данные третьим лицам, за исключением случаев, предусмотренных
            законодательством РФ.
          </Section>

          <Section title="6. Cookies и аналитика">
            Сайт может использовать файлы cookie и системы веб-аналитики для улучшения работы сервиса. Вы можете
            отключить cookie в настройках браузера.
          </Section>

          <Section title="7. Контакты оператора">
            По вопросам обработки персональных данных обращайтесь к Оператору{" "}
            {s.email ? (
              <>
                по адресу{" "}
                <a href={`mailto:${s.email}`} className="text-terracotta underline underline-offset-2">
                  {s.email}
                </a>
              </>
            ) : (
              "по контактам, указанным на странице «Контакты»"
            )}
            .
          </Section>
        </div>
      </Container>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      <p className="mt-2 leading-relaxed">{children}</p>
    </section>
  );
}
