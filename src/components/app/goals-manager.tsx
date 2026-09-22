"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NumberInput } from "@/components/ui/number-field";
import { GOAL_PRESETS, goalPresetIcon } from "@/lib/finance/constants";
import { goalMonthlyNeed } from "@/lib/finance/calculations";
import { fmtRp } from "@/lib/finance/format";
import { addGoal, updateGoal, deleteGoal } from "@/app/app/goals/actions";
import type { Goal } from "@/lib/finance/types";

function twoYearsFromNow(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().slice(0, 10);
}

export function GoalsManager({ goals, fcf }: { goals: Goal[]; fcf: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(goals);
  const [syncedGoals, setSyncedGoals] = useState(goals);
  const [pickerOpen, setPickerOpen] = useState(false);
  if (goals !== syncedGoals) {
    setSyncedGoals(goals);
    setLocal(goals);
  }

  function create(name: string) {
    setPickerOpen(false);
    startTransition(async () => {
      await addGoal(name, twoYearsFromNow());
      router.refresh();
    });
  }

  function patchLocal(id: string, patch: Partial<Goal>) {
    setLocal((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function commit(id: string, patch: { name?: string; target?: number; current?: number; targetDate?: string }) {
    startTransition(async () => {
      await updateGoal(id, patch);
      router.refresh();
    });
  }

  function remove(id: string) {
    setLocal((prev) => prev.filter((g) => g.id !== id));
    startTransition(async () => {
      await deleteGoal(id);
      router.refresh();
    });
  }

  return (
    <div className="px-5">
      {local.length === 0 && (
        <div className="text-sm text-text-dim mb-6 py-4 text-center">
          Belum ada goals. Klik &quot;+ Tambah Goal&quot; di bawah untuk mulai.
        </div>
      )}
      {local.map((g) => {
        const synced = syncedGoals.find((s) => s.id === g.id) ?? g;
        const dirty =
          g.name !== synced.name ||
          g.target !== synced.target ||
          g.current !== synced.current ||
          g.targetDate !== synced.targetDate;
        const need = goalMonthlyNeed(g);
        const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
        const onTrack = need <= Math.max(0, fcf);
        return (
          <div key={g.id} className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-3.5 shadow-[var(--shadow-card)]">
            <div className="flex justify-between items-center gap-2.5 mb-3">
              <input
                type="text"
                value={g.name}
                onChange={(e) => patchLocal(g.id, { name: e.target.value })}
                placeholder="Nama goal"
                className="flex-1 text-sm font-medium px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text"
              />
              <button
                className="text-xs text-critical bg-critical/10 rounded-full px-3 py-1.5 font-medium shrink-0"
                onClick={() => remove(g.id)}
              >
                Hapus
              </button>
            </div>

            <div className="h-1.5 rounded-full bg-hairline overflow-hidden mb-1.5">
              <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-text-dim mb-3">
              <span>
                {fmtRp(g.current)} dari {fmtRp(g.target)} · {Math.round(pct)}%
              </span>
              <span style={{ color: onTrack ? "var(--good)" : "var(--warning)" }}>
                perlu {fmtRp(need)}/bln {onTrack ? "· sesuai jalur" : "· perlu perhatian"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <div>
                <label className="text-[11px] text-text-dim">Target (Rp)</label>
                <NumberInput
                  value={g.target}
                  onValueChange={(n) => patchLocal(g.id, { target: n })}
                  placeholder="0"
                  className="w-full px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] text-text-dim">Terkumpul (Rp)</label>
                <NumberInput
                  value={g.current}
                  onValueChange={(n) => patchLocal(g.id, { current: n })}
                  placeholder="0"
                  className="w-full px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text text-sm"
                />
              </div>
            </div>
            <label className="text-[11px] text-text-dim">Target tanggal</label>
            <input
              type="date"
              value={g.targetDate}
              onChange={(e) => patchLocal(g.id, { targetDate: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text text-sm"
            />

            {dirty && (
              <div className="flex gap-2.5 mt-3">
                <button
                  className="flex-1 text-sm font-medium rounded-lg bg-brand text-brand-ink py-2 disabled:opacity-50"
                  disabled={isPending}
                  onClick={() =>
                    commit(g.id, { name: g.name, target: g.target, current: g.current, targetDate: g.targetDate })
                  }
                >
                  Simpan
                </button>
                <button
                  className="flex-1 text-sm font-medium rounded-lg border border-hairline text-text-dim py-2 disabled:opacity-50"
                  disabled={isPending}
                  onClick={() => patchLocal(g.id, synced)}
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        );
      })}

      {!pickerOpen && (
        <button
          onClick={() => setPickerOpen(true)}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand text-brand-ink py-3.5 text-sm font-semibold mb-10 disabled:opacity-50"
        >
          <span className="text-base leading-none">+</span> Tambah Goal
        </button>
      )}

      {pickerOpen && (
        <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-10 shadow-[var(--shadow-card)]">
          <div className="flex justify-between items-baseline mb-3">
            <div className="text-sm font-medium">Pilih kategori goal</div>
            <button className="text-xs text-text-dim" onClick={() => setPickerOpen(false)} disabled={isPending}>
              Batal
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => create(p)}
                disabled={isPending}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-hairline bg-bg-input px-2 py-3.5 text-text disabled:opacity-50"
              >
                <span className="text-xl leading-none">{goalPresetIcon(p)}</span>
                <span className="text-xs text-center leading-tight">{p}</span>
              </button>
            ))}
            <button
              onClick={() => create("Goal baru")}
              disabled={isPending}
              className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-hairline text-text-dim text-sm py-3 disabled:opacity-50"
            >
              + Custom
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
