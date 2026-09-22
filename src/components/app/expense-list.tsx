"use client";

import { useMemo, useState } from "react";
import { expenseCatColorVar, expenseCatIcon } from "@/lib/finance/constants";
import { fmtMonthYear, fmtRp } from "@/lib/finance/format";
import { ExpenseEditModal } from "./expense-edit-modal";

export interface ExpenseRow {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
}

export function ExpenseList({ expenses, categories }: { expenses: ExpenseRow[]; categories: string[] }) {
  const [editing, setEditing] = useState<ExpenseRow | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, ExpenseRow[]>();
    for (const e of expenses) {
      const ym = e.date.slice(0, 7);
      if (!map.has(ym)) map.set(ym, []);
      map.get(ym)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [expenses]);

  if (expenses.length === 0) {
    return (
      <div className="mx-5 py-12 text-center text-sm text-text-dim">
        Belum ada transaksi. Tap tombol &quot;Catat&quot; untuk mulai mencatat pengeluaran.
      </div>
    );
  }

  return (
    <div className="mx-5">
      {groups.map(([ym, rows]) => {
        const total = rows.reduce((s, r) => s + r.amount, 0);
        return (
          <div key={ym} className="mb-5">
            <div className="flex justify-between items-baseline mb-2 px-1">
              <div className="text-xs uppercase tracking-wide text-text-dim">{fmtMonthYear(`${ym}-01`)}</div>
              <div className="text-xs text-text-dim">{fmtRp(total)}</div>
            </div>
            <div className="bg-bg-raised border border-hairline rounded-2xl px-4 shadow-[var(--shadow-card)]">
              {rows.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEditing(e)}
                  className="w-full flex items-center justify-between gap-3 py-[11px] border-b border-hairline last:border-b-0 text-sm text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-base shrink-0"
                      style={{ background: `color-mix(in srgb, ${expenseCatColorVar(e.category)} 16%, transparent)` }}
                    >
                      {expenseCatIcon(e.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate">{e.description || e.category}</div>
                      <div className="text-xs text-text-dim">
                        {e.category} · {e.date}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">{fmtRp(e.amount)}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {editing && (
        <ExpenseEditModal open={!!editing} onClose={() => setEditing(null)} categories={categories} expense={editing} />
      )}
    </div>
  );
}
