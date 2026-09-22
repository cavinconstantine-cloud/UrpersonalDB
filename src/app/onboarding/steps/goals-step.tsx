"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { GOAL_PRESETS } from "@/lib/finance/constants";
import type { OnboardingDraft } from "@/lib/onboarding/draft";
import type { Goal } from "@/lib/finance/types";

function twoYearsFromNow(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().slice(0, 10);
}

export function GoalsStep({
  draft,
  update,
  onFinish,
  finishing,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
  onFinish: () => void;
  finishing: boolean;
}) {
  function addGoal(name: string) {
    const goal: Goal = { id: crypto.randomUUID(), name, target: 0, current: 0, targetDate: twoYearsFromNow() };
    update({ goals: [...draft.goals, goal] });
  }
  function updateGoal(id: string, patch: Partial<Goal>) {
    update({ goals: draft.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
  }
  function removeGoal(id: string) {
    update({ goals: draft.goals.filter((g) => g.id !== id) });
  }

  function back() {
    update({ step: "cashflow" });
  }

  return (
    <div>
      <h1 className="serif text-[26px] font-medium mb-2">Apa tujuan finansialmu?</h1>
      <p className="text-text-dim text-sm mb-6 leading-relaxed">Opsional — bisa dilewati dan ditambahkan nanti dari dashboard.</p>

      {draft.goals.map((g) => (
        <div key={g.id} className="border border-hairline rounded-xl p-3.5 mb-3.5">
          <div className="flex justify-between items-center gap-2.5 mb-2.5">
            <input
              type="text"
              value={g.name}
              onChange={(e) => updateGoal(g.id, { name: e.target.value })}
              placeholder="Nama goal"
              className="flex-1 text-sm font-medium px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text"
            />
            <button
              className="text-xs text-brand-strong bg-brand/10 rounded-full px-3 py-1.5 font-medium shrink-0"
              onClick={() => removeGoal(g.id)}
            >
              Hapus
            </button>
          </div>
          <label className="text-[11px] text-text-dim">Target (Rp)</label>
          <input
            type="number"
            inputMode="numeric"
            value={g.target === 0 ? "" : g.target}
            onChange={(e) => updateGoal(g.id, { target: Number(e.target.value) || 0 })}
            placeholder="0"
            className="w-full mb-2 px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text text-sm"
          />
          <label className="text-[11px] text-text-dim">Sudah terkumpul (Rp)</label>
          <input
            type="number"
            inputMode="numeric"
            value={g.current === 0 ? "" : g.current}
            onChange={(e) => updateGoal(g.id, { current: Number(e.target.value) || 0 })}
            placeholder="0"
            className="w-full mb-2 px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text text-sm"
          />
          <label className="text-[11px] text-text-dim">Target tanggal</label>
          <input
            type="date"
            value={g.targetDate}
            onChange={(e) => updateGoal(g.id, { targetDate: e.target.value })}
            className="w-full px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text text-sm"
          />
        </div>
      ))}

      <div className="flex flex-wrap gap-2.5 mb-8">
        {GOAL_PRESETS.map((p) => (
          <Chip key={p} onClick={() => addGoal(p)}>
            {p}
          </Chip>
        ))}
        <Chip onClick={() => addGoal("Goal baru")}>+ Custom</Chip>
      </div>

      <div className="flex gap-2.5">
        <Button variant="ghost" onClick={back} className="w-[90px] flex-none">
          Kembali
        </Button>
        <Button onClick={onFinish} disabled={finishing} className="flex-1">
          {finishing ? "Menyimpan…" : "Selesai — Lihat Dashboard"}
        </Button>
      </div>
    </div>
  );
}
