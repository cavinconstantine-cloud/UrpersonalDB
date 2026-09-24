import { fmtRp, nameOrKamu } from "@/lib/finance/format";

export function InsightCard({
  hasGoals,
  totalNeed,
  fcf,
  name,
}: {
  hasGoals: boolean;
  totalNeed: number;
  fcf: number;
  name?: string | null;
}) {
  const who = nameOrKamu(name);
  if (!hasGoals) {
    return (
      <div className="mx-5 mb-4 p-4 rounded-2xl border border-hairline bg-bg-raised text-sm leading-relaxed shadow-[var(--shadow-card)]">
        Tambahkan goals untuk melihat berapa yang perlu {who} sisihkan tiap bulan agar tercapai tepat waktu.
      </div>
    );
  }
  const good = totalNeed <= fcf;
  return (
    <div
      className="mx-5 mb-4 p-4 rounded-2xl border bg-bg-raised text-sm leading-relaxed shadow-[var(--shadow-card)]"
      style={{ borderColor: good ? "var(--good)" : "var(--warning)" }}
    >
      {good ? (
        <>
          Untuk mencapai semua goals tepat waktu, {who} perlu menabung <strong>{fmtRp(totalNeed)}/bulan</strong>. Free
          cash flow {who} saat ini <strong>{fmtRp(fcf)}/bulan</strong> — cukup, dengan sisa {fmtRp(fcf - totalNeed)}.
        </>
      ) : (
        <>
          Untuk mencapai semua goals tepat waktu, {who} perlu menabung <strong>{fmtRp(totalNeed)}/bulan</strong>, tapi
          free cash flow {who} hanya <strong>{fmtRp(fcf)}/bulan</strong>. Pertimbangkan menggeser target tanggal atau
          meninjau lifestyle expense.
        </>
      )}
    </div>
  );
}
