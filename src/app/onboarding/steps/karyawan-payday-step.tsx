"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OnboardingDraft } from "@/lib/onboarding/draft";

export function KaryawanPaydayStep({
  draft,
  update,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  const [selected, setSelected] = useState(draft.paydayDay ?? 25);

  function next() {
    update({ paydayDay: selected, step: "assetPick" });
  }

  return (
    <div>
      <h1 className="serif text-[24px] font-medium mb-2">Tanggal berapa kamu gajian?</h1>
      <p className="text-text-dim text-[13.5px] mb-[18px] leading-relaxed">
        Pilih tanggal gajian rutinmu. Fixed expense (cicilan, sewa, dll) juga bakal otomatis &quot;kepotong&quot; di
        tanggal yang sama — persis kayak kenyataannya.
      </p>

      <div className="grid grid-cols-7 gap-[7px] mb-4">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setSelected(n)}
            className={cn(
              "aspect-square rounded-[10px] text-[13px] font-medium border transition duration-150 active:scale-95",
              n === selected
                ? "bg-brand/18 text-brand-strong border-brand"
                : "bg-bg-input text-text-dim border-hairline",
            )}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="flex gap-2 bg-warning/10 border border-warning/30 rounded-xl px-3 py-2.5 mb-4">
        <span className="text-xs text-text-muted pt-px">💡</span>
        <span className="text-xs text-text-dim leading-relaxed pl-1.5">
          Kalau gajianmu tanggal 31 tapi bulan itu cuma 28/29/30 hari, kita otomatis pakai{" "}
          <b className="text-text">hari terakhir bulan itu</b> — nggak akan pernah &quot;terlewat.&quot;
        </span>
      </div>

      <div className="bg-bg-raised border border-hairline rounded-2xl p-3.5 mb-2">
        <div className="text-[11px] text-text-muted mb-1">Ringkasan</div>
        <div className="text-[13px] leading-[1.7]">
          💰 Gajian masuk tanggal <b className="text-good">{selected}</b>
          <br />
          🧾 Fixed expense otomatis kepotong tanggal <b className="text-critical">{selected}</b> juga
        </div>
      </div>

      <div className="flex gap-2.5 mt-6">
        <Button variant="ghost" onClick={() => update({ step: "profileType" })} className="w-[90px] flex-none">
          Kembali
        </Button>
        <Button onClick={next} className="flex-1">
          Lanjut
        </Button>
      </div>
    </div>
  );
}
