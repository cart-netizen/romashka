import type { Metadata } from "next";
import { Playfair_Display, Montserrat, Tenor_Sans } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/CookieBanner";
import { YandexMetrica } from "@/components/analytics/YandexMetrica";

const playfair = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Tenor Sans — для цен (как на референсе)
const tenorSans = Tenor_Sans({
  variable: "--font-tenor-sans",
  weight: "400",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const ASSET_HOST = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? "http://localhost:8055";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Мебельный салон «Ромашка» — премиальная мебель в Барнауле",
    template: "%s — Мебельный салон «Ромашка»",
  },
  description:
    "Витрина премиальной мебели от фабрик-партнёров: диваны, кровати, кресла, тумбочки. Салон в Барнауле, доставка по Сибири.",
  openGraph: {
    type: "website",
    siteName: "Мебельный салон «Ромашка»",
    locale: "ru_RU",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
  ...(process.env.YANDEX_WEBMASTER_VERIFICATION
    ? { verification: { yandex: process.env.YANDEX_WEBMASTER_VERIFICATION } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${playfair.variable} ${montserrat.variable} ${tenorSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <link rel="preconnect" href={ASSET_HOST} />
        {children}
        <CookieBanner />
        <YandexMetrica id={process.env.NEXT_PUBLIC_YANDEX_METRICA_ID} />
      </body>
    </html>
  );
}
