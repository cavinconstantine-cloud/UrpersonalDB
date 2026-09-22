import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-md border-b border-hairline">
      <div className="max-w-[1100px] mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="serif text-[18px] text-brand-strong">
          Uangku
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
