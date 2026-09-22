import { fmtRp } from "@/lib/finance/format";
import type { DbrResult } from "@/lib/finance/calculations";

const TONE_VAR: Record<DbrResult["tone"], string> = {
  good: "var(--good)",
  watch: "var(--warning)",
  danger: "var(--critical)",
  neutral: "var(--hairline)",
};

export function DbrCard({ dbr, hasFixedExpense }: { dbr: DbrResult; hasFixedExpense: boolean }) {
  const color = TONE_VAR[dbr.tone];
  return (
    <div
      className="mx-5 mb-4 p-4 rounded-2xl border bg-bg-raised shadow-[var(--shadow-card)]"
      style={{ borderColor: dbr.tone === "neutral" ? "var(--hairline)" : color }}
    >
      <div className="flex justify-between items-baseline mb-1.5">
        <strong className="text-sm">Debt Burden Ratio (DBR)</strong>
        <span className="font-medium" style={{ color }}>
          {dbr.income > 0 ? `${dbr.pct}%` : "—"}
        </span>
      </div>
      <div className="text-[13px] text-text-dim leading-relaxed">
        Total cicilan bulanan {fmtRp(dbr.monthlyDebt)} dari income {fmtRp(dbr.income)}/bulan.{" "}
        {dbr.income > 0 ? (
          <>
            <span style={{ color }}>{dbr.label}</span> — dari sudut pandang bank, ambang DBR yang umum dipakai untuk
            menilai kapasitas kredit baru biasanya berkisar 30–40% dari income. Ini estimasi indikatif; tiap bank
            punya kebijakan credit scoring sendiri.
          </>
        ) : (
          "Isi Income di Cash Flow untuk menghitung rasio ini."
        )}
        {hasFixedExpense && (
          <>
            <br />
            Catatan: pastikan cicilan di atas tidak dobel-hitung dengan &quot;Fixed expense&quot; di Cash Flow, agar
            Free Cash Flow tetap akurat.
          </>
        )}
      </div>
    </div>
  );
}
