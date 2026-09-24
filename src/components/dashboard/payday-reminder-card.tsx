import { fmtRp, nameOrKamu } from "@/lib/finance/format";

export function PaydayReminderCard({
  label,
  fcf,
  savingRate,
  name,
}: {
  label: string;
  fcf: number;
  savingRate: number;
  name?: string | null;
}) {
  const positive = fcf >= 0;
  const who = nameOrKamu(name);
  return (
    <div
      className="mx-5 mb-4 p-4 rounded-2xl border bg-brand/10 text-sm leading-relaxed shadow-[var(--shadow-card)]"
      style={{ borderColor: "var(--brand)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base leading-none">🎉</span>
        <span className="font-medium">{label}</span>
      </div>
      {positive ? (
        <>
          Sisa dari income {who} yang belum kepake:{" "}
          <strong style={{ color: "var(--good)" }}>
            {fmtRp(fcf)} ({Math.round(savingRate * 100)}%)
          </strong>
          . Kemungkinan uang ini masih nongkrong di rekening {who} — coba pindahin ke tabungan/investasi biar nggak
          kepake nggak sadar.
        </>
      ) : (
        <>
          Pengeluaran {who} lebih besar dari income:{" "}
          <strong style={{ color: "var(--critical)" }}>
            {fmtRp(Math.abs(fcf))} ({Math.round(savingRate * 100)}%)
          </strong>
          . Coba cek lagi pos pengeluaran yang bisa dipangkas bulan depan.
        </>
      )}
    </div>
  );
}
