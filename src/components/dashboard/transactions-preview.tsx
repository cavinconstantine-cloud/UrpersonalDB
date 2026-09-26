import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { expenseCatColorVar, expenseCatIcon, incomeCatColorVar, incomeCatIcon } from "@/lib/finance/constants";
import { fmtRpCompact } from "@/lib/finance/format";
import type { TxRow } from "@/components/app/transaction-list";

const MONTH_ABBR_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayAndMonth(isoDate: string): { day: string; month: string } {
  return { day: String(Number(isoDate.slice(8, 10))), month: MONTH_ABBR_EN[Number(isoDate.slice(5, 7)) - 1] ?? "" };
}

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
      title="🧾 Recent Transactions"
      action={
        <div className="text-[13px] text-text-dim text-right">
          In {fmtRpCompact(monthIncomeTotal)}
          <br />
          Out {fmtRpCompact(monthExpenseTotal)}
        </div>
      }
    >
      {transactions.length === 0 ? (
        <div className="text-sm text-text-dim py-2 pb-4">No transactions recorded yet.</div>
      ) : (
        <>
          {transactions.map((t) => {
            const isIncome = t.type === "income";
            const icon = (isIncome ? incomeCatIcon : expenseCatIcon)(t.category);
            const color = (isIncome ? incomeCatColorVar : expenseCatColorVar)(t.category);
            const { day, month } = dayAndMonth(t.date);
            return (
              <div
                key={`${t.type}-${t.id}`}
                className="flex items-center gap-3 py-[11px] border-b border-hairline last:border-b-0 text-sm"
              >
                <div className="w-6 shrink-0 text-center leading-tight">
                  <div className="text-[13px] font-semibold">{day}</div>
                  <div className="text-[10px] text-text-muted">{month}</div>
                </div>
                <div
                  className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-base shrink-0"
                  style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
                >
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{t.description || t.category}</div>
                  <div className="text-xs text-text-dim flex items-center gap-1.5 flex-wrap">
                    <span>{t.category}</span>
                    {t.accountLabel && (
                      <span className="inline-flex items-center gap-1 bg-bg-input border border-hairline rounded-full px-1.5 py-[1px]">
                        🏦 {t.accountLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0" style={{ color: isIncome ? "var(--good)" : undefined }}>
                  {isIncome ? "+" : "-"}
                  {fmtRpCompact(t.amount)}
                </div>
              </div>
            );
          })}
          <Link href="/app/expenses" className="block text-center text-xs text-brand-strong py-3">
            View all transactions ›
          </Link>
        </>
      )}
    </SectionCard>
  );
}
