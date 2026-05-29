import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MessengerFab } from "@/components/widgets/MessengerFab";
import { CouponWidget } from "@/components/widgets/CouponWidget";
import { assetUrl, getCategories, getSiteSettings } from "@/lib/directus";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()]);
  const couponImage = assetUrl(categories.find((c) => c.hero_image)?.hero_image, {
    width: 480,
    height: 600,
    fit: "cover",
  });

  return (
    <>
      <JsonLd data={organizationJsonLd(settings)} />
      <JsonLd data={websiteJsonLd()} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MessengerFab messengerLink={settings.messenger_max_link} phone={settings.phone} />
      <CouponWidget image={couponImage} promoAmount={settings.promo_amount} />
    </>
  );
}
