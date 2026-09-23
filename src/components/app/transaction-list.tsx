"use client";

import { useMemo, useState } from "react";
import { expenseCatColorVar, expenseCatIcon, incomeCatColorVar, incomeCatIcon } from "@/lib/finance/constants";
import { fmtMonthYear, fmtRp } from "@/lib/finance/format";
import { TransactionEditModal } from "./transaction-edit-modal";
import type { CashAccount, TransactionType } from "./transaction-modal";

export interface TxRow {
  id: string;
  type: TransactionType;
  date: string;
  category: string;
  amount: number;
  description: string;
  accountHoldingId: string | null;
  accountLabel: string | null;
}

export function TransactionList({
  transactions,
  expenseCategories,
  incomeCategories,
  cashAccounts,
}: {
  transactions: TxRow[];
  expenseCategories: string[];
  incomeCategories: string[];
  cashAccounts: CashAccount[];
}) {
  const [editing, setEditing] = useState<TxRow | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, TxRow[]>();
    for (const t of transactions) {
      const ym = t.date.slice(0, 7);
      if (!map.has(ym)) map.set(ym, []);
      map.get(ym)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="mx-5 py-12 text-center text-sm text-text-dim">
        Belum ada transaksi. Tap tombol &quot;Catat&quot; atau &quot;Pemasukan&quot; untuk mulai mencatat.
      </div>
    );
  }

  return (
    <div className="mx-5">
      {groups.map(([ym, rows]) => {
        const net = rows.reduce((s, r) => s + (r.type === "income" ? r.amount : -r.amount), 0);
        return (
          <div key={ym} className="mb-5">
            <div className="flex justify-between items-baseline mb-2 px-1">
              <div className="text-xs uppercase tracking-wide text-text-dim">{fmtMonthYear(`${ym}-01`)}</div>
              <div className="text-xs" style={{ color: net >= 0 ? "var(--good)" : "var(--critical)" }}>
                {net >= 0 ? "+" : ""}
                {fmtRp(net)}
              </div>
            </div>
            <div className="bg-bg-raised border border-hairline rounded-2xl px-4 shadow-[var(--shadow-card)]">
              {rows.map((t) => {
                const isIncome = t.type === "income";
                const icon = (isIncome ? incomeCatIcon : expenseCatIcon)(t.category);
                const color = (isIncome ? incomeCatColorVar : expenseCatColorVar)(t.category);
                return (
                  <button
                    key={`${t.type}-${t.id}`}
                    onClick={() => setEditing(t)}
                    className="w-full flex items-center justify-between gap-3 py-[11px] border-b border-hairline last:border-b-0 text-sm text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-base shrink-0"
                        style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
                      >
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate">{t.description || t.category}</div>
                        <div className="text-xs text-text-dim flex items-center gap-1.5 flex-wrap">
                          <span>
                            {t.category} · {t.date}
                          </span>
                          {t.accountLabel && (
                            <span className="inline-flex items-center gap-1 bg-bg-input border border-hairline rounded-full px-1.5 py-[1px]">
                              🏦 {t.accountLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0" style={{ color: isIncome ? "var(--good)" : undefined }}>
                      {isIncome ? "+" : "-"}
                      {fmtRp(t.amount)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {editing && (
        <TransactionEditModal
          open={!!editing}
          onClose={() => setEditing(null)}
          type={editing.type}
          categories={editing.type === "expense" ? expenseCategories : incomeCategories}
          cashAccounts={cashAccounts}
          transaction={editing}
        />
      )}
    </div>
  );
}
