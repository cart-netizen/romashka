"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function UspBanner({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => clearInterval(t);
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-terracotta/30 bg-terracotta/10 px-4 py-3">
      <p className="min-h-10 text-sm text-ink">{messages[index]}</p>
      {messages.length > 1 && (
        <div className="mt-2 flex gap-1.5">
          {messages.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Сообщение ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-terracotta" : "w-1.5 bg-terracotta/40")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
