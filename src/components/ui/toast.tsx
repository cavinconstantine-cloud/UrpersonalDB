"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS: Record<ToastVariant, number> = { success: 3000, info: 3000, error: 5500 };
const ICON: Record<ToastVariant, typeof CheckCircle2> = { success: CheckCircle2, error: XCircle, info: Info };
const ICON_COLOR: Record<ToastVariant, string> = {
  success: "text-good",
  error: "text-critical",
  info: "text-brand-strong",
};

/** Toasts are the only signal once a modal or optimistic update has already closed/settled — the loading spinner alone can't tell the user how it ended. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, variant, message }]);
      setTimeout(() => dismiss(id), DURATION_MS[variant]);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-0 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pointer-events-none"
      >
        {toasts.map((t) => {
          const Icon = ICON[t.variant];
          return (
            <button
              key={t.id}
              type="button"
              role="status"
              onClick={() => dismiss(t.id)}
              className="pointer-events-auto w-full max-w-[440px] flex items-start gap-2.5 rounded-xl border border-hairline bg-bg-raised px-3.5 py-3 text-left shadow-[var(--shadow-pop)] animate-toast-in"
            >
              <Icon size={17} className={cn("shrink-0 mt-0.5", ICON_COLOR[t.variant])} />
              <span className="text-[13px] text-text leading-relaxed">{t.message}</span>
            </button>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
