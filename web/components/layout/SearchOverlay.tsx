"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="relative border-b border-line bg-cream">
        <Container className="py-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const term = q.trim();
              router.push(term ? `/catalog?q=${encodeURIComponent(term)}` : "/catalog");
              onClose();
            }}
            className="flex items-center gap-3"
          >
            <SearchIcon className="h-5 w-5 text-muted" />
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по каталогу: название, артикул…"
              className="h-11 flex-1 bg-transparent text-lg text-ink placeholder:text-muted/70 focus:outline-none"
            />
            <button type="button" aria-label="Закрыть поиск" onClick={onClose} className="text-muted hover:text-ink">
              <CloseIcon />
            </button>
          </form>
        </Container>
      </div>
    </div>
  );
}
