"use client";

import { createContext, useContext, useState } from "react";

export interface VariantView {
  label: string;
  dims: string;
  price: number | null;
  image: string | null; // обложка (cover)
  imageFull: string | null; // крупная (для lightbox)
  dimImage: string | null; // чертёж размера
}

interface SizeVariantCtx {
  variants: VariantView[];
  index: number;
  setIndex: (i: number) => void;
}

const Ctx = createContext<SizeVariantCtx | null>(null);

export function SizeVariantProvider({
  variants,
  children,
}: {
  variants: VariantView[];
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  return <Ctx.Provider value={{ variants, index, setIndex }}>{children}</Ctx.Provider>;
}

/** Возвращает контекст размеров-вариантов или null (если у товара их нет). */
export function useSizeVariant(): SizeVariantCtx | null {
  return useContext(Ctx);
}
