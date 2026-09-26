"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NumberInput } from "@/components/ui/number-field";
import { Spinner } from "@/components/ui/spinner";
import { expenseCatIcon } from "@/lib/finance/constants";
import { fmtRp } from "@/lib/finance/format";
import { setBudget } from "@/app/app/settings/budget-actions";
import { useLanguage } from "./language-provider";

export interface CategoryBudgetRow {
  category: string;
  monthlyLimit: number;
}

export function BudgetManager({ rows }: { rows: CategoryBudgetRow[] }) {
  const { dict } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(rows);
  const [synced, setSynced] = useState(rows);
  if (rows !== synced) {
    setSynced(rows);
    setLocal(rows);
  }
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalBudget = local.reduce((s, r) => s + r.monthlyLimit, 0);

  function patchLocal(category: string, monthlyLimit: number) {
    setLocal((prev) => prev.map((r) => (r.category === category ? { ...r, monthlyLimit } : r)));
  }

  function commit(category: string, monthlyLimit: number) {
    setError(null);
    setSavingCategory(category);
    startTransition(async () => {
      try {
        await setBudget(category, monthlyLimit);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan — coba lagi.");
      } finally {
        setSavingCategory(null);
      }
    });
  }

  return (
    <div id="budget" className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)] scroll-mt-6">
      <div className="flex justify-between items-baseline mb-1">
        <div className="serif text-[15px]">{dict.budget.title}</div>
        <div className="text-sm text-text-dim">
          {fmtRp(totalBudget)}
          {dict.budget.perMonth}
        </div>
      </div>
      <p className="text-xs text-text-dim mb-3 leading-relaxed">{dict.budget.helper}</p>
      {error && (
        <div className="text-[11.5px] text-critical bg-critical/10 border border-critical/30 rounded-lg px-3 py-2.5 mb-3 leading-relaxed">
          ⚠️ {error}
        </div>
      )}
      <div>
        {local.map((r) => {
          const rowSaving = isPending && savingCategory === r.category;
          return (
            <div key={r.category} className="flex items-center gap-2.5 py-2 border-b border-hairline last:border-b-0">
              <div className="flex-1 min-w-0 text-sm flex items-center gap-1.5">
                <span>{expenseCatIcon(r.category)}</span>
                <span className="truncate">{r.category}</span>
                {rowSaving && <Spinner size={12} className="text-text-dim" />}
              </div>
              <NumberInput
                value={r.monthlyLimit}
                onValueChange={(n) => patchLocal(r.category, n)}
                onBlur={() => commit(r.category, local.find((x) => x.category === r.category)!.monthlyLimit)}
                placeholder="0"
                disabled={rowSaving}
                className="w-[130px] text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg-input text-text disabled:opacity-60"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
