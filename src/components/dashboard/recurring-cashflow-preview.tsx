import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { fmtRp } from "@/lib/finance/format";
import type { RecurringItem } from "@/components/app/recurring-items-manager";

export function RecurringCashflowPreview({
  incomeItems,
  expenseItems,
}: {
  incomeItems: RecurringItem[];
  expenseItems: RecurringItem[];
}) {
  const incomeTotal = incomeItems.reduce((s, r) => s + r.amount, 0);
  const expenseTotal = expenseItems.reduce((s, r) => s + r.amount, 0);

  return (
    <SectionCard
      title="💳 Recurring Cash Flow"
      action={
        <Link
          href="/app/cashflow"
          className="text-xs text-brand-strong bg-brand/10 rounded-full px-3 py-1.5 font-medium"
        >
          Manage
        </Link>
      }
    >
      <p className="text-xs text-text-dim mb-3 -mt-1 leading-relaxed">
        Recurring monthly income & expenses — the basis for your Free Cash Flow calculation.
      </p>
      <div className="flex gap-2.5 pb-3">
        <div className="flex-1 rounded-xl bg-bg-input p-3">
          <div className="text-xs text-text-dim mb-1">Recurring income</div>
          <div className="serif text-[16px]">{fmtRp(incomeTotal)}</div>
        </div>
        <div className="flex-1 rounded-xl bg-bg-input p-3">
          <div className="text-xs text-text-dim mb-1">Recurring expenses</div>
          <div className="serif text-[16px]">{fmtRp(expenseTotal)}</div>
        </div>
      </div>
    </SectionCard>
  );
}
