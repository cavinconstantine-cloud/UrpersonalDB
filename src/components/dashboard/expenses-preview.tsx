import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { expenseCatColorVar, expenseCatIcon } from "@/lib/finance/constants";
import { fmtRp } from "@/lib/finance/format";

interface ExpenseRow {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
}

export function ExpensesPreview({ expenses, monthTotal }: { expenses: ExpenseRow[]; monthTotal: number }) {
  return (
    <SectionCard
      title="🧾 Pengeluaran bulan ini"
      action={<div className="text-[13px] text-text-dim">{fmtRp(monthTotal)}</div>}
    >
      {expenses.length === 0 ? (
        <div className="text-sm text-text-dim py-2 pb-4">Belum ada pengeluaran tercatat.</div>
      ) : (
        <>
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 py-[11px] border-b border-hairline last:border-b-0 text-sm">
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
            </div>
          ))}
          <Link href="/app/expenses" className="block text-center text-xs text-brand-strong py-3">
            Lihat semua transaksi ›
          </Link>
        </>
      )}
    </SectionCard>
  );
}
