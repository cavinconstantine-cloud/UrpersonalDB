import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { expenseCatColorVar, expenseCatIcon, incomeCatColorVar, incomeCatIcon } from "@/lib/finance/constants";
import { fmtRp } from "@/lib/finance/format";
import type { TxRow } from "@/components/app/transaction-list";

export function TransactionsPreview({
  transactions,
  monthExpenseTotal,
  monthIncomeTotal,
}: {
  transactions: TxRow[];
  monthExpenseTotal: number;
  monthIncomeTotal: number;
}) {
  return (
    <SectionCard
      title="🧾 Transaksi terbaru"
      action={
        <div className="text-[13px] text-text-dim text-right">
          Masuk {fmtRp(monthIncomeTotal)}
          <br />
          Keluar {fmtRp(monthExpenseTotal)}
        </div>
      }
    >
      {transactions.length === 0 ? (
        <div className="text-sm text-text-dim py-2 pb-4">Belum ada transaksi tercatat.</div>
      ) : (
        <>
          {transactions.map((t) => {
            const isIncome = t.type === "income";
            const icon = (isIncome ? incomeCatIcon : expenseCatIcon)(t.category);
            const color = (isIncome ? incomeCatColorVar : expenseCatColorVar)(t.category);
            return (
              <div
                key={`${t.type}-${t.id}`}
                className="flex items-center justify-between gap-3 py-[11px] border-b border-hairline last:border-b-0 text-sm"
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
                    <div className="text-xs text-text-dim">
                      {t.category} · {t.date}
                    </div>
                  </div>
                </div>
                <div className="shrink-0" style={{ color: isIncome ? "var(--good)" : undefined }}>
                  {isIncome ? "+" : "-"}
                  {fmtRp(t.amount)}
                </div>
              </div>
            );
          })}
          <Link href="/app/expenses" className="block text-center text-xs text-brand-strong py-3">
            Lihat semua transaksi ›
          </Link>
        </>
      )}
    </SectionCard>
  );
}
