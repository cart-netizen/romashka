import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { getSiteSettings } from "@/lib/directus";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Контакты",
  description: "Адрес салона, телефон, e-mail и часы работы «Ромашка» в Барнауле.",
};

export default async function ContactsPage() {
  const s = await getSiteSettings();
  const mapEmbed = s.map_embed?.trim();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Главная", href: "/" }, { label: "Контакты" }]}
        title="Контакты"
        description="Приезжайте в салон или свяжитесь удобным способом — поможем с выбором и расчётом."
      />
      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <ul className="space-y-5 text-ink">
            {s.address && (
              <li className="flex items-start gap-3">
                <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />
                <div>
                  <p className="text-sm text-muted">Салон</p>
                  <p>{s.address}</p>
                </div>
              </li>
            )}
            {s.phone && (
              <li className="flex items-start gap-3">
                <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />
                <div>
                  <p className="text-sm text-muted">Телефон</p>
                  <a href={`tel:${s.phone.replace(/[^+\d]/g, "")}`} className="hover:text-terracotta">
                    {s.phone}
                  </a>
                </div>
              </li>
            )}
            {s.email && (
              <li className="flex items-start gap-3">
                <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />
                <div>
                  <p className="text-sm text-muted">E-mail</p>
                  <a href={`mailto:${s.email}`} className="hover:text-terracotta">
                    {s.email}
                  </a>
                </div>
              </li>
            )}
            {s.work_hours && (
              <li className="flex items-start gap-3">
                <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />
                <div>
                  <p className="text-sm text-muted">Часы работы</p>
                  <p>{s.work_hours}</p>
                </div>
              </li>
            )}
            {s.messenger_max_link && (
              <li>
                <ButtonLink href={s.messenger_max_link} variant="burgundy" target="_blank" rel="noopener noreferrer">
                  Написать в MAX
                </ButtonLink>
              </li>
            )}
          </ul>

          <div className="min-h-72 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {mapEmbed ? (
              mapEmbed.startsWith("<") ? (
                <div className="h-full [&_iframe]:h-full [&_iframe]:w-full" dangerouslySetInnerHTML={{ __html: mapEmbed }} />
              ) : (
                <iframe src={mapEmbed} title="Карта проезда" className="h-full min-h-72 w-full" loading="lazy" />
              )
            ) : (
              <div className="flex h-full min-h-72 items-center justify-center p-6 text-center text-muted">
                Карта проезда появится после заполнения настроек салона.
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
