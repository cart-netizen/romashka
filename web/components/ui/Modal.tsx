"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { CloseIcon } from "./icons";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[1px]" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-surface p-6 shadow-[var(--shadow-soft)] outline-none sm:rounded-lg sm:p-8",
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-4 top-4 text-muted transition-colors hover:text-ink"
        >
          <CloseIcon />
        </button>
        {title && <h2 className="mb-5 pr-8 text-2xl">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
