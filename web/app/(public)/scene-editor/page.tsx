import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { HotspotPicker } from "@/components/admin/HotspotPicker";
import { assetUrl, getShowcaseScenes } from "@/lib/directus";

// Служебная утилита для админа — не индексируется, всегда свежие сцены.
export const metadata: Metadata = {
  title: "Координаты для «Shop the look»",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function SceneEditorPage() {
  const scenes = await getShowcaseScenes();
  const data = scenes.map((s) => ({
    id: s.id,
    title: s.title,
    image: assetUrl(s.image, { width: 1600, height: 900, fit: "cover" }),
    hotspots: s.hotspots.map((h) => ({
      id: h.id,
      pos_x: h.pos_x,
      pos_y: h.pos_y,
      product: h.product ? { name: h.product.name } : null,
    })),
  }));

  return (
    <Container className="py-10">
      <h1 className="text-3xl sm:text-4xl">Координаты для «Shop the look»</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Служебная страница (не индексируется поисковиками). Выберите сцену, кликните по фото в нужной
        точке — получите готовые <b>pos_x</b> / <b>pos_y</b> для вкладки <b>Showcase Hotspots</b> в админке
        Directus. Тёмные точки — уже существующие маркеры (для ориентира).
      </p>
      <div className="mt-8">
        <HotspotPicker scenes={data} />
      </div>
    </Container>
  );
}
