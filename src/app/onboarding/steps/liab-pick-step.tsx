"use client";

import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { LIAB_CATS, catIcon } from "@/lib/finance/constants";
import type { OnboardingDraft } from "@/lib/onboarding/draft";

export function LiabPickStep({
  draft,
  update,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  function toggle(cat: string) {
    const has = draft.liabCats.includes(cat);
    update({ liabCats: has ? draft.liabCats.filter((c) => c !== cat) : [...draft.liabCats, cat] });
  }

  function back() {
    if (draft.assetCats.length === 0) {
      update({ step: "assetPick" });
      return;
    }
    update({ step: "assetInput", assetIdx: draft.assetCats.length - 1 });
  }

  function next() {
    if (draft.liabCats.length === 0) {
      update({ step: "cashflow" });
      return;
    }
    update({ step: "liabInput", liabIdx: 0 });
  }

  return (
    <div>
      <h1 className="serif text-[26px] font-medium mb-2">Apakah kamu memiliki utang?</h1>
      <p className="text-text-dim text-sm mb-7 leading-relaxed">Pilih yang relevan, atau lewati jika tidak ada.</p>
      <div className="flex flex-wrap gap-2.5 mb-8">
        {LIAB_CATS.map((c) => (
          <Chip key={c} active={draft.liabCats.includes(c)} onClick={() => toggle(c)}>
            {catIcon(c)} {c}
          </Chip>
        ))}
      </div>
      <div className="flex gap-2.5">
        <Button variant="ghost" onClick={back} className="w-[90px] flex-none">
          Kembali
        </Button>
        <Button onClick={next} className="flex-1">
          Lanjut
        </Button>
      </div>
    </div>
  );
}
