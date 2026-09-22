"use client";

import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { ASSET_CATS, catIcon } from "@/lib/finance/constants";
import type { OnboardingDraft } from "@/lib/onboarding/draft";

export function AssetPickStep({
  draft,
  update,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  function toggle(cat: string) {
    const has = draft.assetCats.includes(cat);
    update({ assetCats: has ? draft.assetCats.filter((c) => c !== cat) : [...draft.assetCats, cat] });
  }

  function next() {
    if (draft.assetCats.length === 0) {
      update({ step: "liabPick" });
      return;
    }
    update({ step: "assetInput", assetIdx: 0 });
  }

  return (
    <div>
      <h1 className="serif text-[26px] font-medium mb-2">Aset apa saja yang kamu miliki?</h1>
      <p className="text-text-dim text-sm mb-7 leading-relaxed">
        Pilih semua yang relevan. Kamu bisa lewati yang tidak dimiliki, dan menambah kategori baru kapan saja dari dashboard.
      </p>
      <div className="flex flex-wrap gap-2.5 mb-8">
        {ASSET_CATS.map((c) => (
          <Chip key={c} active={draft.assetCats.includes(c)} onClick={() => toggle(c)}>
            {catIcon(c)} {c}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2.5">
        <Button variant="ghost" onClick={() => update({ step: "account" })} className="w-[90px] flex-none">
          Kembali
        </Button>
        <Button onClick={next} className="flex-1">
          Lanjut
        </Button>
      </div>
    </div>
  );
}
