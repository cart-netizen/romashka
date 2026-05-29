// Структурированные данные (JSON-LD) и SEO-помощники.
import type { SiteSettings } from "./directus.types";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const AREA_SERVED = [
  "Алтайский край",
  "Республика Алтай",
  "Новосибирская область",
  "Кемеровская область",
  "Томская область",
];

/** Серверный компонент: рендерит <script type="application/ld+json">. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // данные формируются на сервере из доверенного источника
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd(settings: SiteSettings): object {
  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "@id": `${SITE_URL}/#organization`,
    name: "ООО «Ромашка»",
    url: SITE_URL,
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Барнаул",
      ...(settings.address ? { streetAddress: settings.address } : {}),
      addressCountry: "RU",
    },
    areaServed: AREA_SERVED.map((name) => ({ "@type": "AdministrativeArea", name })),
    ...(settings.work_hours ? { openingHours: settings.work_hours } : {}),
  };
}

export function websiteJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Мебельный салон «Ромашка»",
    inLanguage: "ru-RU",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/catalog?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url?: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.url ? { item: `${SITE_URL}${it.url}` } : {}),
    })),
  };
}

export function productJsonLd(opts: {
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  image?: string | null;
  priceFrom?: number | null;
  inStock: boolean;
  brand?: string | null;
  rating?: { value: number; count: number } | null;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    ...(opts.image ? { image: [opts.image] } : {}),
    ...(opts.sku ? { sku: opts.sku } : {}),
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.brand ? { brand: { "@type": "Brand", name: opts.brand } } : {}),
    ...(opts.priceFrom != null
      ? {
          offers: {
            "@type": "AggregateOffer",
            lowPrice: opts.priceFrom,
            priceCurrency: "RUB",
            availability: opts.inStock ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
            offerCount: 1,
            url: `${SITE_URL}/product/${opts.slug}`,
          },
        }
      : {}),
    ...(opts.rating && opts.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(opts.rating.value.toFixed(1)),
            reviewCount: opts.rating.count,
          },
        }
      : {}),
  };
}
