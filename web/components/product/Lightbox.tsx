"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRightIcon, CloseIcon } from "@/components/ui/icons";

/** Просмотр фото по центру экрана с затемнением. Закрытие — клик по фону / Esc.
 *  Рендерится порталом в body — чтобы быть поверх любого stacking-context
 *  (липкая галерея, аккордеоны и т.п.). */
export function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const multiple = images.length > 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && multiple) onNext();
      else if (e.key === "ArrowLeft" && multiple) onPrev();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onPrev, onNext, multiple]);

  const src = images[index];
  if (!src || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-cream/15 text-cream transition-colors hover:bg-cream/25"
      >
        <CloseIcon className="h-6 w-6" />
      </button>

      {multiple && (
        <button
          type="button"
          aria-label="Предыдущее фото"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-cream/15 text-cream transition-colors hover:bg-cream/25 sm:left-6"
        >
          <ChevronRightIcon className="h-6 w-6 rotate-180" />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[92vw] cursor-default rounded-[var(--radius-card)] object-contain shadow-2xl"
      />

      {multiple && (
        <button
          type="button"
          aria-label="Следующее фото"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-cream/15 text-cream transition-colors hover:bg-cream/25 sm:right-6"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      )}

      {multiple && (
        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-cream/15 px-3 py-1 text-sm text-cream">
          {index + 1} / {images.length}
        </span>
      )}
    </div>,
    document.body,
  );
}
