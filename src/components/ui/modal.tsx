"use client";

import { cn } from "@/lib/utils";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-up"
      style={{ animationDuration: "150ms" }}
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full sm:max-w-[480px] bg-bg rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto thin-scroll p-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] sm:pb-6",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="serif text-[19px] font-medium mb-4">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
