import { catValue } from "./calculations";
import type { CashflowNums, DbrResult, HoldingRow } from "./calculations";
import { fmtRp } from "./format";
import { liabValue } from "./schemas";
import type { Goal } from "./types";

export function buildFinancialSnapshot(input: {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  assetCats: string[];
  liabCats: string[];
  holdings: HoldingRow[];
  liabRows: HoldingRow[];
  cf: CashflowNums;
  dbr: DbrResult;
  goals: Goal[];
  liquidAssets: number;
  monthIncomeTracked: number;
}): string {
  const assetLines =
    input.assetCats.map((c) => `- ${c}: ${fmtRp(catValue(c, input.holdings))}`).join("\n") || "(belum ada)";
  const liabLines =
    input.liabRows
      .map((l) => {
        const label = l.data.label ? ` (${l.data.label})` : "";
        return `- ${l.category}${label}: ${fmtRp(liabValue(l.data))}`;
      })
      .join("\n") || "(belum ada)";
  const goalLines =
    input.goals
      .map(
        (g) =>
          `- ${g.name}: target ${fmtRp(g.target)}, terkumpul ${fmtRp(g.current)} (${
            g.target > 0 ? Math.round((g.current / g.target) * 100) : 0
          }%), target tanggal ${g.targetDate}`,
      )
      .join("\n") || "(belum ada)";

  return `Net worth: ${fmtRp(input.netWorth)}
Total aset: ${fmtRp(input.totalAssets)}
Total utang: ${fmtRp(input.totalLiabilities)}
Liquid assets (Cash + Deposito): ${fmtRp(input.liquidAssets)}
Rincian aset:
${assetLines}
Rincian utang:
${liabLines}
Pemasukan tambahan tercatat bulan ini (di luar income rutin, mis. transferan/side income): ${fmtRp(input.monthIncomeTracked)}
Income bulanan (rutin): ${fmtRp(input.cf.income)}
Fixed expense: ${fmtRp(input.cf.fixedExpense)}
Lifestyle expense (termasuk pengeluaran tercatat bulan ini): ${fmtRp(input.cf.lifestyleTotal)}
Investasi rutin bulanan: ${fmtRp(input.cf.invest)}
Free cash flow bulanan: ${fmtRp(input.cf.fcf)}
Saving rate: ${Math.round(input.cf.savingRate * 100)}%
Debt Burden Ratio (total cicilan bulanan / income bulanan): ${
    input.dbr.income > 0 ? input.dbr.pct + "%" : "belum bisa dihitung"
  } (kategori: ${input.dbr.label})
Goals:
${goalLines}`;
}
