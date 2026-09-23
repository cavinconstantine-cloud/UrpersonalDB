"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

/** Bump this when new slides are added so everyone sees the update once more. */
const SEEN_VERSION = "1";

function seenKey(userId: string) {
  return `uangku_whatsnew_seen_${userId}`;
}

interface WhatsNewSlideshowProps {
  userId: string;
  /** false when the logged-in user hasn't picked Karyawan/Pengusaha yet — shows the profile-completion slide first. */
  hasProfileType: boolean;
}

export function WhatsNewSlideshow({ userId, hasProfileType }: WhatsNewSlideshowProps) {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    // Read after mount (not in a lazy initializer) so the first client render
    // matches the server-rendered "hidden" state and avoids a hydration mismatch.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(seenKey(userId)) !== SEEN_VERSION) setVisible(true);
    } catch {
      // best-effort only
    }
  }, [userId]);

  const slides = hasProfileType ? PIE_FILTER_SPLIT_SLIDES : [PROFILE_SLIDE, ...PIE_FILTER_SPLIT_SLIDES];
  const last = slides.length - 1;

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(seenKey(userId), SEEN_VERSION);
    } catch {
      // best-effort only
    }
  }

  function next() {
    if (slide >= last) {
      dismiss();
      return;
    }
    setSlide((s) => s + 1);
  }

  if (!visible || typeof document === "undefined") return null;

  const current = slides[slide];

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 animate-fade-up" style={{ animationDuration: "150ms" }}>
      <div className="w-full sm:max-w-[420px] sm:rounded-3xl bg-bg rounded-t-3xl px-5 pt-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] sm:pb-6 flex flex-col" style={{ minHeight: "min(78vh, 620px)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted">Ada yang baru ✨</span>
          <button
            onClick={dismiss}
            aria-label="Tutup"
            className="w-[26px] h-[26px] rounded-full bg-bg-raised text-text-dim text-[13px] flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-1.5 py-2.5">
          <span
            className="w-[76px] h-[76px] rounded-[24px] flex items-center justify-center text-[34px] mb-5"
            style={{ background: current.wash, animation: current.wiggle ? "whatsNewWiggle 2.4s ease-in-out infinite" : undefined }}
          >
            {current.icon}
          </span>
          <div className="serif text-[22px] mb-2.5 leading-tight">{current.title}</div>
          <div className="text-[13px] text-text-dim leading-relaxed max-w-[290px] mb-4">{current.body}</div>
          {current.cta && (
            <Link
              href={current.cta.href}
              onClick={dismiss}
              className="block w-full text-center bg-brand text-white rounded-2xl px-5 py-3.5 text-sm font-semibold mb-2.5"
            >
              {current.cta.label}
            </Link>
          )}
          {current.dismissLabel && (
            <button onClick={next} className="text-xs text-text-muted underline">
              {current.dismissLabel}
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 mb-4">
          {slides.map((_, i) => (
            <span
              key={i}
              className="h-[5px] rounded-full transition-all"
              style={{ width: i === slide ? 20 : 5, background: i === slide ? "var(--brand)" : "var(--hairline)" }}
            />
          ))}
        </div>

        {slide > 0 && (
          <div className="flex items-center justify-between">
            <button onClick={dismiss} className="text-[13px] text-text-muted">
              Lewati
            </button>
            <button onClick={next} className="bg-bg-raised border border-hairline text-text rounded-xl px-[22px] py-[11px] text-[13.5px] font-medium">
              {slide === last ? "Mulai" : "Lanjut →"}
            </button>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes whatsNewWiggle {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          15% { transform: translateY(-7px) rotate(-10deg) scale(1.05); }
          30% { transform: translateY(0) rotate(9deg) scale(1); }
          45% { transform: translateY(-4px) rotate(-6deg) scale(1.03); }
          60% { transform: translateY(0) rotate(5deg) scale(1); }
          75% { transform: translateY(-1px) rotate(0deg) scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  );
}

interface Slide {
  icon: string;
  wash: string;
  title: string;
  body: string;
  wiggle?: boolean;
  cta?: { label: string; href: string };
  dismissLabel?: string;
}

const PROFILE_SLIDE: Slide = {
  icon: "🎯",
  wash: "rgba(124,110,242,0.14)",
  title: "Ada yang baru buat kamu ✨",
  body: "Sekarang Uangku bisa disesuaikan sama cara kamu dapat penghasilan — Karyawan gajian bulanan atau Pengusaha/freelancer yang naik-turun. Hitungan Free Cash Flow-mu jadi makin pas. Cuma 30 detik.",
  wiggle: true,
  cta: { label: "Coba Sekarang →", href: "/app/settings" },
  dismissLabel: "Nanti aja",
};

const PIE_FILTER_SPLIT_SLIDES: Slide[] = [
  {
    icon: "🥧",
    wash: "rgba(124,110,242,0.14)",
    title: "Sebaran Pengeluaran",
    body: "Sekarang ada grafik donut di halaman Transaksi — langsung keliatan kategori mana yang paling boros bulan ini, tanpa hitung manual.",
  },
  {
    icon: "🔍",
    wash: "rgba(63,191,114,0.14)",
    title: "Cari & Filter Transaksi",
    body: "Cari transaksi lewat nama, atau filter by kategori, Sumber Dana, dan urutkan dari yang terbaru — semua di halaman Transaksi.",
  },
];
