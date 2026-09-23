"use client";

import { Button } from "@/components/ui/button";
import type { OnboardingDraft, ProfileType } from "@/lib/onboarding/draft";

const OPTIONS: { value: ProfileType; icon: string; title: string; subtitle: string; body: string; wash: string }[] = [
  {
    value: "karyawan",
    icon: "💼",
    title: "Karyawan",
    subtitle: "Gaji tetap, ada tanggal gajian",
    body: "Pendapatan & fixed expense-mu jalan di tanggal yang sama tiap bulan — kita ikutin ritme itu persis.",
    wash: "bg-brand/14",
  },
  {
    value: "pengusaha",
    icon: "📈",
    title: "Pengusaha & Freelancer",
    subtitle: "Pendapatan naik-turun, nggak tentu tanggal",
    body: "Nggak perlu isi angka bulanan tetap — Uangku ngitung otomatis dari pendapatan yang kamu catat.",
    wash: "bg-good/14",
  },
];

export function ProfileTypeStep({
  update,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  function pick(value: ProfileType) {
    update({
      profileType: value,
      step: value === "pengusaha" ? "pengusahaIntro" : "karyawanPayday",
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h1 className="serif text-[26px] font-medium">Pekerjaanmu apa?</h1>
        <span className="text-[9.5px] font-bold tracking-wide text-warning bg-warning/14 border border-warning/35 rounded-full px-1.5 py-0.5">
          BARU
        </span>
      </div>
      <p className="text-text-dim text-sm mb-6 leading-relaxed">
        Ini nentuin cara Uangku ngitung arus kas bulananmu — biar pas sama ritme pendapatanmu, bukan asumsi yang
        meleset.
      </p>

      <div className="flex flex-col gap-3.5 mb-6">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => pick(opt.value)}
            className="text-left bg-bg-raised border border-hairline rounded-[20px] p-5 active:scale-[0.98] transition duration-150"
          >
            <div className="flex items-center gap-3 mb-2.5">
              <span className={`w-[46px] h-[46px] rounded-2xl flex items-center justify-center text-[22px] ${opt.wash}`}>
                {opt.icon}
              </span>
              <div>
                <div className="text-[16px] font-semibold">{opt.title}</div>
                <div className="text-[11.5px] text-text-muted">{opt.subtitle}</div>
              </div>
            </div>
            <div className="text-[12.5px] text-text-dim leading-relaxed">{opt.body}</div>
          </button>
        ))}
      </div>

      <Button variant="ghost" onClick={() => update({ step: "account" })} className="w-[90px]">
        Kembali
      </Button>
    </div>
  );
}
