"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutGrid, Receipt, Wallet, Settings } from "lucide-react";
import { useLanguage } from "./language-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { dict } = useLanguage();

  const ITEMS = [
    { href: "/app", label: dict.nav.home, icon: LayoutGrid },
    { href: "/app/expenses", label: dict.nav.transactions, icon: Receipt },
    { href: "/app/cashflow", label: dict.nav.cashflow, icon: Wallet },
    { href: "/app/settings", label: dict.nav.settings, icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-hairline bg-bg/90 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Navigasi utama"
    >
      <div className="max-w-[560px] mx-auto grid grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
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
        })}
      </div>
    </nav>
  );
}
