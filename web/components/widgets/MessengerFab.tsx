"use client";

import Link from "next/link";
import { ChatIcon, PhoneIcon } from "@/components/ui/icons";

/** Плавающие кнопки связи: MAX (если задан) и/или телефон. */
export function MessengerFab({ messengerLink, phone }: { messengerLink: string | null; phone: string | null }) {
  const hasMax = !!messengerLink;
  const hasPhone = !!phone;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 print:hidden">
      {hasPhone && (
        <a
          href={`tel:${phone.replace(/[^+\d]/g, "")}`}
          aria-label={`Позвонить ${phone}`}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-burgundy text-cream shadow-[var(--shadow-soft)] transition-transform hover:scale-105"
        >
          <PhoneIcon className="h-5 w-5" />
        </a>
      )}
      <Link
        href={hasMax ? messengerLink : "/contacts"}
        {...(hasMax ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        aria-label={hasMax ? "Написать в MAX" : "Связаться с салоном"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-cta text-cream shadow-[var(--shadow-soft)] transition-transform hover:scale-105"
      >
        <ChatIcon className="h-6 w-6" />
      </Link>
    </div>
  );
}
