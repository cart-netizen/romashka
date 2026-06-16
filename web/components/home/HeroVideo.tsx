"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 768px)";

// Видео рендерится только на десктопе. На мобильных элемента нет вовсе —
// видео не загружается, показывается фоновое изображение (под ним).
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(QUERY);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false, // SSR/первый рендер: считаем мобильным → без видео
  );
}

export function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const isDesktop = useIsDesktop();
  if (!isDesktop) return null;
  return (
    <video
      className="absolute inset-0 h-full w-full object-cover object-center"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={poster}
    >
      <source src={src} />
    </video>
  );
}
