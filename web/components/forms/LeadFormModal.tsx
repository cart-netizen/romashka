"use client";

import { Modal } from "@/components/ui/Modal";
import { LeadForm } from "./LeadForm";

type LeadType = "callback" | "price_request" | "contact";

const TITLES: Record<LeadType, string> = {
  price_request: "Узнать цену",
  callback: "Заказать звонок",
  contact: "Связаться с салоном",
};

export function LeadFormModal({
  open,
  onClose,
  type,
  product,
  productName,
  selectedSize,
}: {
  open: boolean;
  onClose: () => void;
  type: LeadType;
  product?: number;
  productName?: string;
  selectedSize?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={TITLES[type]}>
      {productName && <p className="mb-4 text-sm text-muted">{productName}</p>}
      <LeadForm type={type} product={product} selectedSize={selectedSize} />
    </Modal>
  );
}
