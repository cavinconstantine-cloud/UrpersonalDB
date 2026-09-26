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
          Leftover from {who}&apos;s income that hasn&apos;t been spent:{" "}
          <strong style={{ color: "var(--good)" }}>
            {fmtRp(fcf)} ({Math.round(savingRate * 100)}%)
          </strong>
          . It&apos;s probably still sitting in {who}&apos;s account — consider moving it to savings/investments before
          it quietly gets spent.
        </>
      ) : (
        <>
          {who}&apos;s spending is higher than income:{" "}
          <strong style={{ color: "var(--critical)" }}>
            {fmtRp(Math.abs(fcf))} ({Math.round(savingRate * 100)}%)
          </strong>
          . Worth reviewing which expenses can be trimmed next month.
        </>
      )}
    </div>
  );
}
