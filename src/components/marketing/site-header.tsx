import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-md border-b border-hairline">
      <div className="max-w-[1100px] mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg viewBox="0 0 100 100" width="28" height="28" className="shrink-0" aria-hidden="true">
            <defs>
              <linearGradient id="siteHeaderLogoBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7a6cf0" />
                <stop offset="100%" stopColor="#2f2066" />
              </linearGradient>
              <linearGradient id="siteHeaderLogoGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f6e2ab" />
                <stop offset="55%" stopColor="#d9b45f" />
                <stop offset="100%" stopColor="#9c7a2e" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="22" fill="url(#siteHeaderLogoBg)" />
            <path
              d="M32,26 L32,56 A18,18 0 0 0 68,56 L68,26"
              fill="none"
              stroke="url(#siteHeaderLogoGold)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="56" r="9" fill="url(#siteHeaderLogoGold)" />
          </svg>
          <span className="serif text-[18px] text-brand-strong">Uangku</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-7 text-sm text-text-dim">
          <a href="#fitur" className="hover:text-text">
            Fitur
          </a>
          <a href="#cara-kerja" className="hover:text-text">
            Cara kerja
          </a>
          <a href="#faq" className="hover:text-text">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-text-dim hover:text-text hidden sm:inline">
            Masuk
          </Link>
          <LinkButton href="/signup" size="pill">
            Coba gratis
          </LinkButton>
        </div>
      </div>
    </header>
  );
}
