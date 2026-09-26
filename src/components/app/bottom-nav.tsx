"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LayoutGrid, Receipt, CalendarRange, Settings } from "lucide-react";
import { useLanguage } from "./language-provider";

export function BottomNav({ onAddClick }: { onAddClick: () => void }) {
  const pathname = usePathname();
  const { dict } = useLanguage();

  const ITEMS = [
    { href: "/app", label: dict.nav.home, icon: LayoutGrid },
    { href: "/app/expenses", label: dict.nav.transactions, icon: Receipt },
    { href: "/app/summary", label: dict.nav.summary, icon: CalendarRange },
    { href: "/app/settings", label: dict.nav.settings, icon: Settings },
  ];

  function navLink({ href, label, icon: Icon }: (typeof ITEMS)[number]) {
    const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
          active ? "text-brand-strong" : "text-text-muted",
        )}
      >
        <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
        {label}
      </Link>
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-hairline bg-bg/90 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Navigasi utama"
    >
      <div className="max-w-[560px] mx-auto grid grid-cols-5">
        {ITEMS.slice(0, 2).map(navLink)}
        <div className="relative flex items-center justify-center">
          <button
            onClick={onAddClick}
            aria-label={dict.shell.addTransactionAria}
            className="absolute -top-6 w-14 h-14 rounded-full bg-brand text-brand-ink flex items-center justify-center shadow-[var(--shadow-pop)] active:scale-95 transition-transform"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>
        {ITEMS.slice(2).map(navLink)}
      </div>
    </nav>
  );
}
