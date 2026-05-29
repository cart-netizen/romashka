import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Мебельный салон «Ромашка» — премиальная мебель в Барнауле",
  description:
    "Витрина премиальной мебели от фабрик-партнёров: диваны, кровати, кресла, тумбочки. Салон в Барнауле, доставка по Сибири.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
